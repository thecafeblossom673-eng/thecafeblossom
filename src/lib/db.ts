import * as actions from '../actions';

/**
 * DB Proxy Object
 * This proxies all database calls from the client components directly to the 
 * Next.js Server Actions, which then interact with the MongoDB Services.
 * This preserves the exact same API used by the frontend while migrating 
 * the entire backend to MongoDB.
 */
export const db = actions;
