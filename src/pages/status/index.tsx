import { StatusResponse } from "pages/api/v1/status";
import useSWR from "swr";

async function fetchAPI(key: string) {
  const response = await fetch(key);
  if (!response.ok) throw new Error(`Erro ao carregar ${key}`);
  return response.json();
}

export default function SutatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <h1>Database</h1>
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR<StatusResponse>(
    "/api/v1/status",
    fetchAPI,
    {
      refreshInterval: 2000,
    },
  );
  let UpdatedAtText = "Loading...";

  if (!isLoading && data) {
    UpdatedAtText = new Date(data.updated_at).toLocaleString("us");
  }

  return (
    <>
      <b>Last Update: </b>
      {UpdatedAtText}
    </>
  );
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR<StatusResponse>(
    "/api/v1/status",
    fetchAPI,
    {
      refreshInterval: 2000,
    },
  );
  let DatabaseStatusText = <div>Loading...</div>;
  if (!isLoading && data) {
    DatabaseStatusText = (
      <>
        <div>
          <b>Version: </b> {data.dependencies.database.version}
        </div>
        <div>
          <b>Max Connections: </b> {data.dependencies.database.max_connections}
        </div>
        <div>
          <b>Opened Connections: </b>{" "}
          {data.dependencies.database.opened_connections}
        </div>
      </>
    );
  }
  return DatabaseStatusText;
}
