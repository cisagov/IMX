export class RasterImageExtension {
    extension_id: string;
    extension_type: string;
    image_height: number;
    image_width: number;
    bits_per_pixel: number;
    exif_tags: any;

    constructor(
        extension_id?: string,
        extension_type?: string,
        image_height?: number,
        image_width?: number,
        bits_per_pixel?: number,
        exif_tags?: any
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        if (image_height != undefined) this.image_height = image_height;
        if (image_width != undefined) this.image_width = image_width;
        if (bits_per_pixel != undefined) this.bits_per_pixel = bits_per_pixel;
        this.exif_tags = exif_tags || new Map();
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.image_height ? selectors.push('image_height') : null;
        this.image_width ? selectors.push('image_width') : null;
        this.bits_per_pixel ? selectors.push('bits_per_pixel') : null;
        this.exif_tags ? selectors.push('exif_tags') : null;
        return selectors;
    }
}
