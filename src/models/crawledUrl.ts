export interface ICrawledUrlError
{
    url: string;
    statusCode: number;
    errorMessage?: string;
    parentUrl?: string;
}

export interface ICrawlUrl
{
    urlToCrawl: string;
    parentUrl?: string;
}