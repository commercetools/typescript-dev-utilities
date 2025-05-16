import path from "path";
import dotenv from "dotenv";
import { homepage } from "../../package.json";

export type Credentials = {
  clientId: string;
  clientSecret: string;
  projectKey?: string;
};

export function setCredentialsFromEnvFile() {
  const currentDirectoryResult = dotenv.config({
    path: path.resolve(".ct-credentials.env"),
  });

  const etcDirectoryResult = dotenv.config({
    path: path.resolve(path.join("/etc", ".ct-credentials.env")),
  });

  return {
    ...currentDirectoryResult.parsed,
    ...etcDirectoryResult.parsed,
  };
}

export function getCredentialsFromEnvironment(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const clientId = process.env["CTP_CLIENT_ID"];
    const clientSecret = process.env["CTP_CLIENT_SECRET"];
    const projectKey = process.env["CTP_PROJECT_KEY"];

    const credentials = { projectKey, clientId, clientSecret };
    const keys = Object.keys(credentials);

    for (let i = 0; i < keys.length; i++) {
      if (!keys[i]) {
        return reject(
          new Error(`
            Could not find environment variable ${keys[i]}
            see ${homepage}#usage
          `)
        );
      }
    }

    return resolve(credentials);
  });
}

export default async function getCredentials() {
  try {
    await Promise.resolve(setCredentialsFromEnvFile());
    return getCredentialsFromEnvironment();
  } catch (err) {
    return Promise.reject(err);
  }
}
