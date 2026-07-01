import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'bundlefilter',
    pure: false,
    standalone: false,
})
export class BundleTypeFilter implements PipeTransform {
    transform(items: any[], filter: string) {
        if (!items || !filter) return items;
        return items.filter((item) => item && item.type === filter);
    }
}
