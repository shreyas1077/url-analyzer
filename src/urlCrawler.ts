import {ICrawlUrl, ICrawledUrlError} from './models/crawledUrl';
import UrlUtilities from './utilities/urlUtilities';
import cheerio from 'cheerio';
import * as _ from 'lodash';
import puppeteer from 'puppeteer';

class UrlCrawler
{
    private readonly domain: string;
    private readonly allowExternalDomainsToCrawl: string[];
    private readonly urlsToCrawl: ICrawlUrl[];

    constructor(
        domain: string,
        urlsToCrawl: string[],
        allowExternalDomainsToCrawl: string[] = []
    )
    {
        if(!UrlUtilities.isAbsoluteUrl(domain))
        {
            throw new Error('Invalid URL format for the domain');
        }

        if(!urlsToCrawl.length)
        {
            throw new Error('URLs must be provided as a non-empty array of strings');
        }

        // Validate each URL in the array
        // Validate each URL in the array to ensure they are relative URLs
        for(const url of urlsToCrawl)
        {
            if(UrlUtilities.isAbsoluteUrl(url))
            {
                throw new Error(`Invalid relative URL format for the URL: ${url}`);
            }
        }

        for(const url of allowExternalDomainsToCrawl)
        {
            if(!UrlUtilities.isAbsoluteUrl(url))
            {
                throw new Error(`Invalid absolute URL format for the URL: ${url}`);
            }
        }

        // Remove trailing slash from domain
        this.domain = UrlUtilities.removeTrailingSlash(domain);
        this.urlsToCrawl = urlsToCrawl.map(
            (url: string): ICrawlUrl => ({
                urlToCrawl: `${domain}${UrlUtilities.addStartingSlash(url)}`,
            })
        );
        this.allowExternalDomainsToCrawl = allowExternalDomainsToCrawl;
    }

    private async fetchContent(url: string): Promise<string>
    {
        const browser = await puppeteer.launch({
            headless: 'new',
        });

        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'networkidle0'});

        // Wait for any client-side rendering to complete (you might need to adjust the wait time based on your app)
        // await page.waitForTimeout(2000);

        const content = await page.content();
        await browser.close();

        return content;
    }

    private async crawlUrl(
        crawlUrl: ICrawlUrl
    ): Promise<ICrawledUrlError | void>
    {
        if(
            !UrlUtilities.isStaticAssetUrl(crawlUrl.urlToCrawl) &&
            !this.isExcludedUrl(crawlUrl.urlToCrawl)
        )
        {
            try
            {
                const res = await fetch(crawlUrl.urlToCrawl);
                if(res.status !== 200)
                {
                    return {
                        url: crawlUrl.urlToCrawl,
                        statusCode: res.status,
                        parentUrl: crawlUrl.parentUrl,
                    };
                } else
                {
                    const crawlExternalUrl = this.allowExternalDomainsToCrawl.map(
                        (item: string) => crawlUrl.urlToCrawl.includes(item)
                    );

                    if(
                        !UrlUtilities.isStaticAssetUrl(crawlUrl.urlToCrawl) &&
                        (crawlUrl.urlToCrawl.startsWith(this.domain) ||
                            crawlExternalUrl.some((value: boolean) => value))
                    )
                    {
                        const content = await this.fetchContent(crawlUrl.urlToCrawl);
                        this.extractUrls(content, crawlUrl.urlToCrawl);
                    }
                }
            } catch(error: any)
            {
                return {
                    url: crawlUrl.urlToCrawl,
                    statusCode: -1,
                    errorMessage: error.message,
                    parentUrl: crawlUrl.parentUrl,
                };
            }
        }
    }

    private extractUrls(html: string, parentUrl: string): void
    {
        const $ = cheerio.load(html);
        $('a').each((index, element) =>
        {
            const link = $(element).attr('href');

            if(link)
            {
                const absoluteLink = UrlUtilities.isAbsoluteUrl(link)
                    ? link
                    : `${this.domain}${UrlUtilities.addStartingSlash(link)}`;

                const isAlreadyAddedToQueue: boolean = _.some(
                    this.urlsToCrawl,
                    (item: ICrawlUrl) => item.urlToCrawl.includes(absoluteLink)
                );

                if(!isAlreadyAddedToQueue)
                {
                    this.urlsToCrawl.push({
                        urlToCrawl: absoluteLink,
                        parentUrl: parentUrl,
                    });
                }
            }
        });
    }

    public async start(): Promise<ICrawledUrlError[]>
    {
        const result: ICrawledUrlError[] = [];

        for(const url of this.urlsToCrawl)
        {
            const status = await this.crawlUrl(url);

            if(status)
            {
                const errorAlreadyReported = _.some(
                    result,
                    (item: ICrawlUrl) => item.urlToCrawl == status.url
                );

                if(!errorAlreadyReported)
                {
                    result.push(status);
                    console.log(
                        'Failed to crawl: ',
                        status.url + ' ' + status.statusCode
                    );
                }
            }
        }

        return result;
    }

    private isExcludedUrl(url: string): boolean
    {
        const urlsStartsWith = ['mailto:', 'tel:', 'javascript:', 'sms:'];
        const externalUrlsStartsWith = ['https://twitter.com/intent/tweet'];

        let shouldExclude = urlsStartsWith.some((value: string) =>
            url.startsWith(`${this.domain}${UrlUtilities.addStartingSlash(value)}`)
        );

        shouldExclude = shouldExclude || externalUrlsStartsWith.some((value: string) =>
            url.startsWith(value)
        );

        return shouldExclude;
    }
}

export default UrlCrawler;

