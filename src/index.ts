import {setUser, readConfig} from "./config.js";
import {createUser, getUserByName, deleteAllusers, getAllUsers} from "./lib/db/queries/users.js";
import {createFeed, getFeeds, getFeedByUrl} from "./lib/db/queries/feeds.js";
import {createFeedFollow, getFeedFollowsForUser, deleteFeedFollow} from "./lib/db/queries/feedFollows.js";
import { User } from "./lib/db/schema.js";
import { scrapeFeeds } from "./lib/scraper.js";
import { getPostsForUser } from "./lib/db/queries/posts";



type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;

function parseDuration(durationStr: string): number {

    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);

    if (!match) {
        throw new Error("Invalid duration");
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch(unit) {
        case 'ms':
            return value;
        case 's':
            return value * 1000;
        case 's':
            return  value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        default: throw new Error("Invalid duration");
    }
}

function middlewareLoggedIn(handler: UserCommandHandler):  CommandHandler {
    return async (cmdName: string, ...args: string[]) => {
        const cfg = readConfig();

        if (!cfg.currentUserName) {
            throw new Error("no user logged in");
        }

        const user = await getUserByName(cfg.currentUserName);

        if (!user) {
            throw new Error(`User ${cfg.currentUserName} not found`);
        }
        return handler(cmdName, user, ...args);
    };
}

async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
    let limit = 2;

    if (args.length > 2) {
        limit = parseInt(args[0]);
    }
    const posts = await getPostsForUser(user.id, limit)

    for (const post of posts) {
        console.log(post.title)
        console.log(post.url);
        console.log();
    }
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {

    if (args.length === 0) {
        throw new Error("URL required");
    }

    const url = args[0];

    await deleteFeedFollow(user.id, url);

    console.log(`${user.name} unfollowed  ${url}`);
}


async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {

    const follows = await getFeedFollowsForUser(user.id);

    for (const f of follows) {
        console.log(`FeedName: ${f.feedName} userName: ${f.userName}`);
    }
}


async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {

    if (args.length === 0) {
        throw new Error("URL required");
    }

    const url = args[0];

    const feed = await getFeedByUrl(url);

    if (!feed) {
        throw new Error("Feed not found");
    }

    const follow = await createFeedFollow(feed.id, user.id);

    console.log(`${follow.userName} is now following ${follow.feedName}`);
}


async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
    const feeds = await getFeeds();
    
    for (const feed of feeds) {
        console.log(`feedName: ${feed.feedName}`);
        console.log(`feedURL: ${feed.feedURl}`);
        console.log(`UserName: ${feed.userName}`);
        console.log();
    }
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {

    if (args.length < 2) {
        throw new Error("usage: addfeed <name> <url>");
    }

    const name = args[0];
    const url = args[1];

    const feed = await createFeed(name, url, user.id);

    await createFeedFollow(feed.id, user.id);

    console.log("Feed added:");
    console.log("Name:", feed.name);
    console.log("URL:", feed.url);
    console.log("User:", user.name);


}

async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {

    if (args.length === 0) {
        throw new Error("time_between_reqs required");
    }

    const timeBetweenRequests = parseDuration(args[0]);

    console.log(`Collecting feeds every ${args[0]}`);

    await scrapeFeeds();

    const interval = setInterval(() => {
        scrapeFeeds().catch(console.error);
    }, timeBetweenRequests);

    await new Promise<void>((resolve) => {

        process.on("SIGINT", () => {

            console.log("Shutting down feed aggregator...");

            clearInterval(interval);

            resolve();
        });
    });
}


async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
    const allUsers = await getAllUsers();
    const cfg = readConfig();

    for (const user of allUsers) {
        if (user.name === cfg.currentUserName) {
            console.log(`* ${user.name} (current)`);
        }
        else {
            console.log(`* ${user.name}`);
        }
    }
}


async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
    await deleteAllusers();
    console.log("Database reset successful");

}


async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {

    if (args.length === 0) {
        throw new Error("username is required");
    }
    const userName = args[0];

    const existingUser = await getUserByName(userName);

    if (existingUser) {
        throw new Error("User alerady exists");
    }
    const user = await createUser(userName);

    setUser(userName);
    
    console.log("user created");
    console.log(user);
}


async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {

    if (args.length === 0) {
        throw new Error("username is required");
    }

    const userName = args[0];
    
    const user = await getUserByName(userName);

    if (!user) {
        throw new Error("user not found");
    }

    setUser(userName);

    console.log(`User set to ${userName}`);
}


async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): Promise<void> {
    registry[cmdName] = handler;
}


async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]): Promise<void> {

    const handlerFunc = registry[cmdName];

    if (!handlerFunc) {
        throw new Error("Unknown command");
    }

    await handlerFunc(cmdName, ...args);
}


async function main() {
    const commands: CommandsRegistry = {};
    registerCommand(commands, "login", handlerLogin);
    registerCommand(commands, "register", handlerRegister);
    registerCommand(commands, "reset", handlerReset);
    registerCommand(commands, "users", handlerUsers);
    registerCommand(commands, "agg", handlerAgg);
    registerCommand(commands, "addfeed", middlewareLoggedIn(handlerAddFeed))
    registerCommand(commands, "feeds", handlerFeeds);
    registerCommand(commands, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(commands, "following", middlewareLoggedIn(handlerFollowing));
    registerCommand(commands, "unfollow", middlewareLoggedIn(handlerUnfollow));
    registerCommand(commands, "browse", middlewareLoggedIn(handlerBrowse));

    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Not enough arguments");
        process.exit(1);
    }
    const cmdName = args[0];
    const cmdArgs = args.slice(1);

    try {
        await runCommand(commands, cmdName, ...cmdArgs);
    }
    catch (err) {
        console.error((err as Error).message);
        process.exit(1);
    }

    process.exit(0);
}

main();