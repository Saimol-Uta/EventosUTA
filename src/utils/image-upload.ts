import { v2 as cloudinary } from 'cloudinary';

// Validación mejorada de variables de entorno
const validateEnvVariables = () => {
    const requiredVars = {
        CLOUDINARY_CLOUD_NAME: import.meta.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: import.meta.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: import.meta.env.CLOUDINARY_API_SECRET
    };

    // Log para debugging
    console.log('Variables de entorno detectadas:', {
        cloud_name: requiredVars.CLOUDINARY_CLOUD_NAME ? 'presente' : 'ausente',
        api_key: requiredVars.CLOUDINARY_API_KEY ? 'presente' : 'ausente',
        api_secret: requiredVars.CLOUDINARY_API_SECRET ? 'presente' : 'ausente'
    });

    for (const [key, value] of Object.entries(requiredVars)) {
        if (!value) {
            throw new Error(`Variable de entorno ${key} no está configurada`);
        }
        // Validar formato del cloud_name
        if (key === 'CLOUDINARY_CLOUD_NAME' && !/^[a-zA-Z0-9-_]+$/.test(value)) {
            throw new Error(`Cloud name inválido: ${value}. Solo se permiten letras, números, guiones y guiones bajos`);
        }
    }
    return requiredVars;
};

export class ImageUpload {
    static async upload(file: File) {
        try {
            // Validar y obtener variables de entorno
            const config = validateEnvVariables();

            // Configurar Cloudinary con los valores validados
            cloudinary.config({
                cloud_name: config.CLOUDINARY_CLOUD_NAME,
                api_key: config.CLOUDINARY_API_KEY,
                api_secret: config.CLOUDINARY_API_SECRET
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
                throw new Error('Error de autenticación: Verifica que las credenciales de Cloudinary sean correctas y estén bien formateadas');
            }
            throw error;
        }
    }

    static async delete(imageUrl: string) {
        try {
            // Extraer publicId de la URL de Cloudinary
            const publicId = this.extractPublicId(imageUrl);

            if (!publicId) {
                console.warn('No se pudo extraer publicId de la URL:', imageUrl);
                return;
            }

            // Validar y obtener variables de entorno
            const config = validateEnvVariables();

            // Configurar Cloudinary con los valores validados
            cloudinary.config({
                cloud_name: config.CLOUDINARY_CLOUD_NAME,
                api_key: config.CLOUDINARY_API_KEY,
                api_secret: config.CLOUDINARY_API_SECRET
            });

            console.log(`Intentando eliminar imagen de Cloudinary: ${publicId}`);

            const rep = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

            if (rep.result !== 'ok' && rep.result !== 'not found') {
                throw new Error(`Error al eliminar la imagen: ${rep.result}`);
            }

            console.log(`Imagen eliminada exitosamente: ${publicId}`);
            return rep;

        } catch (error: any) {
            console.error('Error detallado al eliminar imagen:', {
                message: error.message,
                code: error.http_code,
                error: error
            });
            throw error;
        }
    }

    // Método privado para extraer publicId de URL de Cloudinary
    private static extractPublicId(url: string): string | null {
        try {
            // Ejemplo de URL: https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/folder/imagen.jpg
            const parts = url.split('/');
            const uploadIndex = parts.indexOf('upload');

            if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
                // Obtener todo después de upload/v1234567890/
                const pathParts = parts.slice(uploadIndex + 2);
                const filename = pathParts.join('/');
                // Remover extensión del archivo
                return filename.replace(/\.[^/.]+$/, '');
            }

            return null;
        } catch (error) {
            console.error('Error extrayendo publicId de URL:', error);
            return null;
        }
    }
}