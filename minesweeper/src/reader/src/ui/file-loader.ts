import { BinaryLevelCodec } from '../../../core/binary/binary-codec.js';
import type { LevelData } from '../../../core/types/level.js';

/**
 * Handle file loading from the file input element.
 *
 * @param onLoad - Callback when a level is successfully loaded.
 * @param onError - Callback when loading fails.
 */
export function setupFileLoader(
  onLoad: (level: LevelData, fileName: string) => void,
  onError: (message: string) => void,
): void {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const fileNameSpan = document.getElementById('file-name') as HTMLSpanElement;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    fileNameSpan.textContent = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const codec = new BinaryLevelCodec();

      const validation = codec.validate(buffer);
      if (!validation.valid) {
        onError(`文件格式错误: ${validation.errors.join('; ')}`);
        return;
      }

      try {
        const level = codec.decode(buffer);
        onLoad(level, file.name);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onError(`解码失败: ${msg}`);
      }
    };

    reader.onerror = () => {
      onError('文件读取失败');
    };

    reader.readAsArrayBuffer(file);
  });
}
