import dotenv from "dotenv";
import path from "path";

// Load .env file with override option
dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    override: true
});

console.log("[ENV] Environment variables loaded with override.");
