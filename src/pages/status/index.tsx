import { StatusResponse } from "pages/api/v1/status";
import useSWR from "swr";

async function fetchAPI(key: string) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function SutatusPage() {
  return (
    <>
      <h1>Status</h1>
      <StatusInfo />
    </>
  );
}

function StatusInfo() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  let UpdatedAtText = "Loading...";
  let DatabaseVersionText = "Loading...";
  let MaxConnectionsText: string | "Error" | number = "Loading...";
  let OpenedConnectionsText: string | "Error" | number = "Loading...";

  if (!isLoading && data) {
    const statusBody: StatusResponse = data;
    UpdatedAtText = new Date(statusBody.updated_at).toLocaleString("us");
    DatabaseVersionText = statusBody.dependencies.database.version;
    MaxConnectionsText = statusBody.dependencies.database.max_connections;
    OpenedConnectionsText = statusBody.dependencies.database.opened_connections;
  }

  return (
    <ul>
      <li>
        <b>Last Update: </b> {UpdatedAtText}
      </li>
      <li>
        <b>Database:</b>
        <ul>
          <li>
            <b>Version: </b> {DatabaseVersionText}
          </li>
          <li>
            <b>Max Connections: </b> {MaxConnectionsText}
          </li>
          <li>
            <b>Opened Connections: </b> {OpenedConnectionsText}
          </li>
        </ul>
      </li>
    </ul>
  );
}
