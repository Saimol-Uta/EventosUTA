import { v2 as cloudinary } from 'cloudinary';

export class ImageUpload {
    static async upload(file: File) {
        try {
            // Configura Cloudinary DENTRO del método
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            console.log('Cloudinary Config en image upload:', {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const imagetype = file.type.split('/')[1];

            console.log('Intentando subir imagen a Cloudinary...');

            const rep = await cloudinary.uploader.upload(
                `data:image/${imagetype};base64,${base64}`,
                { resource_type: 'auto' }
            );

            if (!rep.secure_url) {
                throw new Error('No se pudo obtener la URL de la imagen');
            }

            return rep.secure_url;

        } catch (error: any) {
            console.error('Error detallado de Cloudinary:', {
                message: error.message,
                code: error.http_code,
                error: error
            });

            if (error.http_code === 401) {
                throw new Error('Error de autenticación: Verifica que las credenciales de Cloudinary sean correctas');
            }
            throw error;
        }
    }

    static async delete(imageUrl: string) {
        try {
            // Configura Cloudinary DENTRO del método
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            const publicId = this.extractPublicId(imageUrl);
            if (!publicId) {
                console.warn('No se pudo extraer publicId de la URL:', imageUrl);
                return;
            }

            await cloudinary.uploader.destroy(publicId);

        } catch (error: any) {
            console.error('Error al eliminar imagen:', error);
        }
    }

    private static extractPublicId(url: string): string | null {
        try {
            const parts = url.split('/');
            const uploadIndex = parts.findIndex(part => part === 'upload');
            if (uploadIndex === -1) return null;
            
            const publicIdParts = parts.slice(uploadIndex + 2);
            const publicIdWithExtension = publicIdParts.join('/');
            return publicIdWithExtension.replace(/\.[^/.]+$/, '');
        } catch (error) {
            return null;
        }
    }
}