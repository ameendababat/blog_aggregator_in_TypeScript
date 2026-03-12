import {XMLParser} from 'fast-xml-parser';


type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {

    const res = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator"
        }
    });

    const xml = await res.text();

    const parser = new XMLParser();

    let data = parser.parse(xml);

    if (!data.rss || !data.rss.channel) {
        throw new Error("Invalid RSS feed");
    }
    
    const channel = data.rss.channel;

    if (!channel.title || !channel.link ||!channel.description) {
        throw new Error("Missing channel metadata");
    }

    let items: RSSItem[] = [];

    if (channel.item) {
        const rowItem = Array.isArray(channel.item) ? channel.item : [channel.item];
    
    for (const item of rowItem) {
        if (!item.title || !item.link || !item.description || !item.pubDate) {
            continue;
        }
        items.push({
            title: item.title,
            link: item.link,
            description: item.description,
            pubDate: item.pubDate
        });
    }
    }
    return {
        channel: {
            title: channel.title,
            link: channel.link,
            description: channel.description,
            item: items
        }
    }
}