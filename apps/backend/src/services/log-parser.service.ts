export interface TS3Credentials {
  password: string;
  token: string;
}

/**
 * Parse TeamSpeak 3 server logs to extract admin credentials.
 *
 * The TS3 server outputs lines like:
 *   "serveradmin" account was created with the password "XXXXXXXX"
 *   token=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *
 * Also handles the newer format:
 *   password  = "XXXXXXXX"
 *   apikey    = "XXXXXXXX"
 *   token     = XXXXXXXX
 */
export function parseTS3Logs(logs: string): TS3Credentials {
  let password = '';
  let token = '';

  // Try multiple password patterns
  const passwordPatterns = [
    /password["\s]*[=:]\s*"([^"]+)"/i,
    /password\s*"([^"]+)"/i,
    /\"serveradmin\".*password\s*\"([^\"]+)\"/i,
  ];

  for (const pattern of passwordPatterns) {
    const match = logs.match(pattern);
    if (match) {
      password = match[1];
      break;
    }
  }

  // Try multiple token patterns
  const tokenPatterns = [
    /token[=:]\s*(\S+)/i,
    /privilege key[=:]\s*(\S+)/i,
    /ServerAdmin privilege key created.*?token[=:]\s*(\S+)/i,
  ];

  for (const pattern of tokenPatterns) {
    const match = logs.match(pattern);
    if (match) {
      token = match[1];
      break;
    }
  }

  return { password, token };
}
