import { useState, useEffect } from 'react';

export function useImagePreviews(images: File[]) {
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        // Generate previews for all images
        const generatePreviews = async () => {
            const newPreviews = await Promise.all(
                images.map((image) => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result as string);
                        };
                        reader.readAsDataURL(image);
                    });
                })
            );
            setPreviews(newPreviews);
        };

        if (images.length > 0) {
            generatePreviews();
        } else {
            setPreviews([]);
        }

        // Cleanup: revoke object URLs when component unmounts or images change
        return () => {
            previews.forEach((preview) => {
                if (preview.startsWith('blob:')) {
                    URL.revokeObjectURL(preview);
                }
            });
        };
    }, [images]);

    return previews;
}
