export function dbConnectionString(): string {
  return (
    process.env.DB_CONNECTION_STRING ??
    "postgres://pythiabackend:pythiabackend@localhost:5432/pythia"
  );
}

export function infuraApiKey(): string {
  return process.env.INFURA_API_KEY ?? "";
}
