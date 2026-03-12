import {db} from "..";
import { feeds, users, feedFollows} from "../schema";
import {eq, and} from "drizzle-orm";


export async function createFeedFollow (feedid: string, userId: string) {
    const [newFeedFollow] = await db.insert(feedFollows).values({
        userId: userId,
        feedId: feedid,
    })
    .returning()

    const result = await db.select({
        id: feedFollows.id,
        createdAt: feedFollows.createdAt,
        updatedAt: feedFollows.updatedAt,
        userName: users.name,
        feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.id, newFeedFollow.id));

    return result[0];
}

export async function getFeedFollowsForUser(userId: string) {
    return await db.select({
        feedName: feeds.name,
        userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
}

export async function deleteFeedFollow(userId: string, feedUrl: string) {
    await db.delete(feedFollows)
    .where(
        and(
            eq(feedFollows.userId, userId),
            eq(feedFollows.feedId, (
                db.select({id: feeds.id})
                    .from(feeds)
                    .where(eq(feeds.url, feedUrl))
            ))
        )
    );

}
