class UrlBatcher
{
    public splitUrlsIntoBatches(urls: string[], batchSize: number): string[][]
    {
        const batches: string[][] = [];
        for(let i = 0;i < urls.length;i += batchSize)
        {
            batches.push(urls.slice(i, i + batchSize));
        }
        return batches;
    }
}

export default UrlBatcher;