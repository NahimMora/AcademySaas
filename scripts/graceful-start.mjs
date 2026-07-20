import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const standalone = ".next/standalone/server.js";
const useStandalone = existsSync(standalone) && existsSync(".next/standalone/.next/static");
const command = useStandalone ? standalone : "node_modules/next/dist/bin/next";
const args = useStandalone ? [] : ["start", "-p", process.env.PORT || "3300"];
const child = spawn(process.execPath, [command, ...args], { stdio: "inherit", env: { ...process.env, PORT: process.env.PORT || "3300", HOSTNAME: process.env.HOSTNAME || "0.0.0.0" } });
let stopping = false;
function shutdown(signal) { if (stopping) return; stopping = true; console.log(JSON.stringify({ level: "info", message: "server.shutdown", signal })); child.kill("SIGTERM"); const timer=setTimeout(()=>child.kill("SIGKILL"),10_000);timer.unref(); }
process.on("SIGTERM",()=>shutdown("SIGTERM"));process.on("SIGINT",()=>shutdown("SIGINT"));child.on("exit",code=>process.exit(code??0));
