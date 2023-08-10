class UrlUtilities
{
    public static isAbsoluteUrl(url: string): boolean
    {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    public static removeTrailingSlash(url: string): string
    {
        return url.replace(/\/$/, '');
    }

    public static addStartingSlash(url: string): string
    {
        return url.startsWith('/') ? url : `/${url}`;
    }

    public static getUrlWithoutQueryString(url: string): string
    {
        const queryStringIndex = url.indexOf('?');
        return queryStringIndex !== -1 ? url.slice(0, queryStringIndex) : url;
    }

    public static isStaticAssetUrl(url: string): boolean
    {
        const staticFileExtensionsRegex = /\.(pdf|jpg|jpeg|png|gif|bmp||xml|js|css|ico|js|css|woff|woff2|ttf|eot)$/i;

        const pathWithoutTrailingSlash = UrlUtilities.removeTrailingSlash(UrlUtilities.getUrlWithoutQueryString(url));

        return staticFileExtensionsRegex.test(pathWithoutTrailingSlash);
    }
}

export default UrlUtilities;