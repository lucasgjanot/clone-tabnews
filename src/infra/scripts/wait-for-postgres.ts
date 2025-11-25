import { ExecException } from "child_process";

const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);
  function handleReturn(err: ExecException, stdout: string) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    console.log("\n🟢 Postgress is ready!");
  }
}
process.stdout.write("🔴 Waiting for Postgres to accept connetions...");
checkPostgres();
