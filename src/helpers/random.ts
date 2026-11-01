const UNSIGNED_INT_SPACE = 2 ** 32;

/**
 * Beacons públicas da drand (League of Entropy). Ordem = prioridade de tentativa.
 */
const DRAND_ENDPOINTS = [
  "https://mainnet1-api.drand.cloudflare.com",
  "https://api.drand.sh",
];

const DRAND_TIMEOUT_MS = 1500;

const SHA256_BLOCK_BYTES = 32;

/**
 * Folga de bytes além dos sorteios esperados, para absorver rejeições
 * do rejection sampling sem esgotar o buffer. A probabilidade de
 * rejeição por sorteio é ~maxExclusive/2^32, então 64 bytes bastam.
 */
const SEED_SLACK_BYTES = 64;

const LOCAL_ENTROPY_BYTES = 32;

export interface DrandRound {
  round: number;
  randomness: string;
}

export interface DrawSeedRecord {
  round: number | null;
  drandRandomness: string | null;
  localEntropy: string;
  seed: string;
}

export type SeededRandom = (maxExclusive: number) => number;

/**
 * Inteiro uniforme em [0, maxExclusive) via crypto.getRandomValues + rejection
 * sampling (remove o modulo bias do `Math.floor(Math.random() * n)` e o
 * `%` direto sobre bytes).
 */
export const secureRandomInt = (maxExclusive: number): number => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(
      `[secureRandomInt] maxExclusive deve ser um inteiro positivo (recebido: ${maxExclusive})`,
    );
  }

  const limit = UNSIGNED_INT_SPACE - (UNSIGNED_INT_SPACE % maxExclusive);
  const buffer = new Uint32Array(1);

  let value = 0;

  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % maxExclusive;
};

/**
 * Fisher-Yates sobre uma cópia do array, com fonte criptográfica.
 * Distribuição uniforme sobre n! permutações.
 */
export const secureShuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * Busca o round mais recente da drand tentando os endpoints em paralelo.
 * Sem CORS proxy pois os endpoints públicos liberam `Access-Control-Allow-Origin: *`.
 * Retorna null se todas falharem (fallback transparente para entropia local).
 */
export const fetchLatestDrandRound = async (): Promise<DrandRound | null> => {
  const requests = DRAND_ENDPOINTS.map(async (endpoint) => {
    const response = await fetch(`${endpoint}/public/latest`, {
      signal: AbortSignal.timeout(DRAND_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(
        `[drand] resposta inválida de ${endpoint}: ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      round?: unknown;
      randomness?: unknown;
    };

    if (
      typeof data.round !== "number" ||
      typeof data.randomness !== "string" ||
      !/^[0-9a-f]{64}$/i.test(data.randomness)
    ) {
      throw new Error(`[drand] payload inválido de ${endpoint}`);
    }

    return { round: data.round, randomness: data.randomness };
  });

  try {
    return await Promise.any(requests);
  } catch (error) {
    console.warn(
      "[drand] beacon indisponível, usando apenas entropia local",
      error,
    );

    return null;
  }
};

const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

const concatBytes = (
  ...parts: Uint8Array<ArrayBuffer>[]
): Uint8Array<ArrayBuffer> => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(total);

  let offset = 0;

  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
};

const sha256 = async (
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> => {
  const digest = await crypto.subtle.digest("SHA-256", data);

  return new Uint8Array(digest);
};

/**
 * Cria o registro auditável do sorteio:
 * seed = SHA-256(randomness da drand || entropia local).
 *
 * Misturar as duas fontes mantém o resultado imprevisível mesmo se uma delas
 * estiver comprometida; guardar os dois ingredientes permite recomputar a
 * seed depois e conferir o resultado.
 */
export const createDrawSeedRecord = async (
  drand: DrandRound | null,
): Promise<DrawSeedRecord> => {
  const localEntropy = crypto.getRandomValues(new Uint8Array(LOCAL_ENTROPY_BYTES));
  const drandBytes = drand ? hexToBytes(drand.randomness) : new Uint8Array(0);
  const seed = await sha256(concatBytes(drandBytes, localEntropy));

  return {
    round: drand?.round ?? null,
    drandRandomness: drand?.randomness ?? null,
    localEntropy: bytesToHex(localEntropy),
    seed: bytesToHex(seed),
  };
};

/**
 * PRNG determinístico derivado da seed, expansão em modo contador:
 * bloco(counter) = SHA-256(seed || counter LE-32), cada bloco rende 8 uint32.
 *
 * Como cada sorteio consome no máximo 4 bytes, `drawCount` sorteios cabem em
 * `ceil((drawCount * 4 + slack) / 32)` blocos. Qualquer pessoa com a seed
 * consegue recomputar a sequência com a mesma receita SHA-256.
 */
export const createSeededRandom = async (
  seedHex: string,
  drawCount: number,
): Promise<SeededRandom> => {
  const seed = hexToBytes(seedHex);
  const byteCount = Math.max(drawCount, 0) * 4 + SEED_SLACK_BYTES;
  const blockCount = Math.ceil(byteCount / SHA256_BLOCK_BYTES);
  const buffer = new Uint8Array(blockCount * SHA256_BLOCK_BYTES);

  for (let counter = 0; counter < blockCount; counter++) {
    const input = new Uint8Array(seed.length + 4);

    input.set(seed);
    new DataView(input.buffer).setUint32(seed.length, counter, true);

    const block = await sha256(input);

    buffer.set(block, counter * SHA256_BLOCK_BYTES);
  }

  const integers = new Uint32Array(buffer.buffer, 0, buffer.length / 4);

  let cursor = 0;

  return (maxExclusive: number) => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(
        `[SeededRandom] maxExclusive deve ser um inteiro positivo (recebido: ${maxExclusive})`,
      );
    }

    const limit = UNSIGNED_INT_SPACE - (UNSIGNED_INT_SPACE % maxExclusive);

    let value = 0;

    do {
      if (cursor >= integers.length) {
        throw new Error("[SeededRandom] buffer de entropia esgotado");
      }

      value = integers[cursor];
      cursor += 1;
    } while (value >= limit);

    return value % maxExclusive;
  };
};

/**
 * Fisher-Yates com PRNG derivado da seed. `random` deve ter capacidade de ao
 * menos `items.length - 1` sorteios (buffer do `createSeededRandom`).
 */
export const seededShuffle = <T>(items: T[], random: SeededRandom): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random(i + 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};