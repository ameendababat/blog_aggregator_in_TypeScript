import { resourceLimits } from "worker_threads";
import {db} from "..";
import { feeds, users } from "../schema";
import {eq, sql} from "drizzle-orm";


export async function createFeed(name: string, url: string, userId: string) {
    const [feed] = await db.insert(feeds).values({
        name: name,
        url: url,
        userId: userId
    })
    .returning();

    return feed;
}

export async function getFeeds() {

    const result = await db.select({
        feedName: feeds.name,
        feedURl: feeds.url,
        userName: users.name
    })
    .from(feeds)
    .innerJoin(users, eq(users.id, feeds.userId));

    return result;
}

export async function getFeedByUrl(url: string) {
    const result = await db.select()
    .from(feeds)
    .where(eq(feeds.url, url))

    return result[0]
}

export async function markFeedFetched(feedId: string) {
    await db.update(feeds)
    .set({
        updatedAt: new Date(),
        lastFetchedAt: new Date()
    })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
    const result = await db.select()
    .from(feeds)
    .orderBy(sql`last_fetched_at NULLS FIRST`)
    .limit(1)

    return result[0];
}

export async function deleteAllFeeds() {
    await db.delete(feeds);
}
