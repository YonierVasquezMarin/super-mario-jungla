import { LevelDefinition, LevelFormatError, validateLevel } from './level.model';

async function readJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new LevelFormatError('No se pudo leer el archivo de nivel.');
    }
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof LevelFormatError) {
      throw error;
    }
    throw new LevelFormatError('No se pudo leer el archivo de nivel.');
  }
}

export async function loadManifest(): Promise<string[]> {
  const data = await readJson('/levels/manifest.json');
  if (!Array.isArray(data) || data.some((id) => typeof id !== 'string' || !/^[a-z0-9-]+$/i.test(id))) {
    throw new LevelFormatError('El manifiesto de niveles no es válido.');
  }
  return data;
}

export async function loadLevel(id: string): Promise<LevelDefinition> {
  if (!/^[a-z0-9-]+$/i.test(id)) {
    throw new LevelFormatError('Identificador de nivel no válido.');
  }
  return validateLevel(await readJson(`/levels/${id}.json`));
}
