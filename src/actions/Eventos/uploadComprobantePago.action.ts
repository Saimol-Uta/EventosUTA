
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { ImageUpload } from '../../utils/image-upload';

const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

export const uploadComprobante = defineAction({
  accept: 'form',
  input: z.object({
    comprobante: z.instanceof(File)
      .refine((file) => file.size <= MAX_FILE_SIZE, 'El tamaño máximo es 5MB')
      .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), `Tipo no permitido: ${ACCEPTED_FILE_TYPES.join(', ')}`)
  }),
  handler: async ({ comprobante }) => {
    try {
      const url = await ImageUpload.upload(comprobante); // tu lógica con Cloudinary o equivalente
      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error("Error al subir comprobante:", error);
      return {
        success: false,
        message: "Error al subir el comprobante. Intenta nuevamente.",
      };
    }
  }
});
