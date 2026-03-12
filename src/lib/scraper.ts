import { getNextFeedToFetch, markFeedFetched } from "./db/queries/feeds";
import { createPost } from "./db/queries/posts";
import { fetchFeed } from "./rss";


export async function scrapeFeeds() {

    const feed =await getNextFeedToFetch();

    if (!feed) {
        throw new Error("No feeds found")
    }

    console.log(`Fetching: ${feed.name}`);

    await markFeedFetched(feed.id);

    const rss = await fetchFeed(feed.url);

    for (const item of rss.channel.item) {
        // console.log(item.title);
        let publishedAt: Date | null = null;
        if (item.pubDate) {
            const date = new Date(item.pubDate);
            if (!isNaN(date.getTime())) {
                publishedAt = date;
            }
        }

        try {
            await createPost(
                item.title,
                item.link,
                item.description ?? null,
                publishedAt,
                feed.id
            );

        }
        catch(err) {
            throw new Error("Post exist");
        }
    }
    
}
