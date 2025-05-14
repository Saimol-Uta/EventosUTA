import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
    // Your middleware logic here
    return next();
});