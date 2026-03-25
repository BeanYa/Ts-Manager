import { describe, it, expect } from 'vitest';
import { parseTS3Logs } from '../../src/services/log-parser.service.js';

describe('parseTS3Logs', () => {
  it('should parse password and token from standard TS3 logs', () => {
    const logs = `
2024-01-01 00:00:00.000000|INFO    |ServerLibPriv |   |TeamSpeak 3 Server 3.13.7
2024-01-01 00:00:01.000000|WARNING |ServerLibPriv |   |
2024-01-01 00:00:01.000000|INFO    |ServerLibPriv |   |"serveradmin" account was created with the password "abc12345"
2024-01-01 00:00:01.000000|INFO    |ServerLibPriv |   |ServerAdmin privilege key created, please use the token to gain serveradmin permissions
token=AAAA1111BBBB2222CCCC3333DDDD4444
    `;

    const result = parseTS3Logs(logs);
    expect(result.password).toBe('abc12345');
    expect(result.token).toBe('AAAA1111BBBB2222CCCC3333DDDD4444');
  });

  it('should parse newer format with = signs', () => {
    const logs = `
------------------------------------------------------------------
                      I M P O R T A N T
------------------------------------------------------------------
               Server Query Admin Account created
         loginname= "serveradmin", password= "xyzPASS99"
         apikey= "BAC1-xxxx-xxxx"
------------------------------------------------------------------
      ServerAdmin privilege key created, please use it to gain
      serveradmin permissions for your virtualserver. please
      also check the doc/privilegekey_guide.txt for details.

       token=TOKEN_ABC_123_XYZ_456_789
------------------------------------------------------------------
    `;

    const result = parseTS3Logs(logs);
    expect(result.password).toBe('xyzPASS99');
    expect(result.token).toBe('TOKEN_ABC_123_XYZ_456_789');
  });

  it('should return empty strings when no credentials found', () => {
    const logs = 'Some random log output without any credentials';
    const result = parseTS3Logs(logs);
    expect(result.password).toBe('');
    expect(result.token).toBe('');
  });
});
