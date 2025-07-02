import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export class PdfUpload {
    /**
     * Sube un archivo PDF a Cloudinary.
     * @param file - El objeto File del PDF a subir.
     * @param publicId - Un nombre único para el archivo en Cloudinary.
     */
    static async upload(file: File, publicId: string): Promise<string> {
        // Configura Cloudinary DENTRO del método
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        console.log('Cloudinary Config en upload:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Convertimos el File a un Buffer/Uint8Array
        const pdfBytes = new Uint8Array(await file.arrayBuffer());

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: 'documentos_usuarios',
                    resource_type: 'raw',
                    overwrite: true,
                },
                (error, result) => {
                    if (error) return reject(new Error(`Error de Cloudinary: ${error.message}`));
                    if (result) resolve(result.secure_url);
                }
            );

            Readable.from(Buffer.from(pdfBytes)).pipe(uploadStream);
        });
    }

    /**
     * Elimina un archivo PDF de Cloudinary usando su URL.
     * @param url - La URL del archivo a eliminar.
     */
    static async delete(url: string): Promise<void> {
        if (!url) return;

        try {
            // Configura Cloudinary DENTRO del método
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            // Extraemos el public_id de la URL.
            const parts = url.split('/');
            const publicIdWithFolder = parts.slice(parts.indexOf('documentos_usuarios')).join('/');
            const publicId = publicIdWithFolder.substring(0, publicIdWithFolder.lastIndexOf('.'));

            if (!publicId) return;

            // Usamos destroy con resource_type: 'raw'
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

        } catch (error) {
            console.error("Error al eliminar el PDF de Cloudinary:", error);
        }
    }
}