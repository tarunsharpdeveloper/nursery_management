#!/usr/bin/env node

/**
 * Decrypt Domain Error Response
 * Decrypt the "UNIDENTIFIED MERCHANT DOMAIN" error to see full details
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse .env file
function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const envPath = path.join(__dirname, 'backend', '.env');
const envVars = parseEnv(envPath);

const config = {
  responseKey: envVars.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
  responseSalt: envVars.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

// Encrypted error response
const encryptedResponse = "24FE2F1D4C942461758CDC2EBD0012EF1105CB41BB03DD995006CA18463CD00153A5C501EFBBB51FBC645A551BD59409A84BE6976B7D44479313CA3F8E8779259EBB799D16B3A6D1A5E67D5815AE70B9D07BE2C18D2D2DDC817CF983EC437FACE16191B3F56C82A207D32A6B32737CBD0F25B459AC46A2C00398AF6FF6619368965D40BAFE45CB2F33E158A56B8BB819AEBC74640295DDDE681C435BFB87EA627F31A594E75259BBE3A15E2D76F74A8D9B9435D9BAF53109493307819AC1ADE2571B9547C15DF581D7F9A60A726319634F0C45C98973F6014EADE19B0A9C65EC7D10A2E04573B9D2995855E46C376601ABFF9EE18B985F95DE95CBAD5A6E73B0734DE5D7204895524E08067645E413D91101639371B2BBC559C0554ECEAE4C245A8946F38940FA8C8DBAA91D10F9469D70A01011F14B760FAA8DFEA931E50F8C916851AB8E171C639584861D61FFD3478034EC8B75EF57748EFC063E64B6DC4DC9435544D1521438A13BDD2D33F37CE3B68180D187200914253BA7CD4A65AFEA0EF0DB5E0C887577DD6DE8CAEA123549E5CCE0DBAD11869D94ECD5DD2834BD1128DB72E21AEB636335792BC3B134256D6B0ED00626FC9206CDD34136AA371829436439DF191A78C0A73CBE1AB660743729664E39320921954018037AC54FDA83B8577A53E88CBC3D3ADCA6DE8A74CC2989D4E725A198FDD66F804778174867929FF0EF47C8204067624360DBB09FC3A11B282F352A651A36214D4687E1BD06A93CF0AF7DBFCD71428D2B471F3C49B8B0DEA20F9622AC18AB4CBBCC785B09BFA50C6F4CA1388EEA8022C019905D2DD736BFF63AD580FC6E5E1F6FAB7EF45FF602641E46CAAD5E07F0E81B9B1FE1032E3F0ECF5211100D37C6DA744EAC9013D9811AEB49C156ABCE837C6843B5E2F562442802FF29B5E5DAB429F92B83EBB2AA344FDF93CB10CBCF442597CAAC0342010D8246AE734C42B360F44CB5D2C2BF76A7B1CCE217C166250114A13C7DE00D8BE896273090DB907F4B5C0A263A34CCE4C9695414702D555C1087E3010E3957B91922F49FD608D4A59E172CF69F8A0BBCCE3E08B687484487A54295E4E91F4F8CDFB894FC60467C7B1B8AA0EA17C61CCE41174FAC24EC6687B70B5ECDB73EF54C329D3D8F1A8D4C16FCF28E87B93658AED26659DAA3EDE6CAD5F334335489946A9D126ED3A933DC21879059AF7A46958C2F152DD9ABB6CFFFCECBF9E070988D0B0637B55808E109133388CAFBC7470FCC4FF8CE690DC11B08CECA8BEB53F63FB31AE7ADDF54E52BFF3985EE377FEEF1BEF3FFD13A60B17322CA22CF196267AAEE2A31186B4A8B721D1F488A001871542DEDE07D42146FD09B65BCF17A9CFFE5182AA27F2ADC7BF25EF1971F1D643B7C1BF6F5A031E2A97828A1F43D50FBF67AE7F30244DF902F7B6317212110F1BABEE5D4";

console.log('\n' + '='.repeat(70));
console.log('DECRYPTING DOMAIN ERROR RESPONSE');
console.log('='.repeat(70) + '\n');

console.log('📋 ERROR DETAILS:');
console.log('-'.repeat(70));
console.log('Status Code: OTS0678');
console.log('Description: UNIDENTIFIED MERCHANT DOMAIN');
console.log(`Encrypted message length: ${encryptedResponse.length} characters`);

try {
  const password = Buffer.from(config.responseKey, 'utf8');
  const salt = Buffer.from(config.responseSalt, 'utf8');
  
  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const encryptedBuffer = Buffer.from(encryptedResponse, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  const decryptedText = decrypted.toString('utf8');

  console.log('\n✅ DECRYPTION SUCCESSFUL!');
  console.log('='.repeat(70));
  console.log('\n📋 DECRYPTED ERROR MESSAGE:');
  console.log('-'.repeat(70));
  console.log(decryptedText);

  // Try to parse as JSON
  try {
    const jsonResponse = JSON.parse(decryptedText);
    console.log('\n📋 PARSED ERROR DETAILS:');
    console.log('-'.repeat(70));
    console.log(JSON.stringify(jsonResponse, null, 2));

    console.log('\n📋 ERROR ANALYSIS:');
    console.log('-'.repeat(70));
    
    if (jsonResponse.payInstrument && jsonResponse.payInstrument[0]) {
      const error = jsonResponse.payInstrument[0];
      if (error.responseDetails) {
        console.log(`Status Code: ${error.responseDetails.statusCode || error.responseDetails.txnStatusCode}`);
        console.log(`Message: ${error.responseDetails.message || error.responseDetails.txnMessage}`);
        console.log(`Description: ${error.responseDetails.description || error.responseDetails.txnDescription}`);
      }
    }

  } catch (parseError) {
    console.log('\n⚠️  Could not parse as JSON (might be plain text)');
  }

} catch (error) {
  console.log(`\n❌ DECRYPTION FAILED: ${error.message}`);
}

console.log('\n' + '='.repeat(70));
console.log('DOMAIN REGISTRATION ISSUE');
console.log('='.repeat(70));

console.log(`\n🚨 ROOT CAUSE:`);
console.log(`The error "UNIDENTIFIED MERCHANT DOMAIN" means NTT Data doesn't`);
console.log(`recognize your domain in their merchant registration.`);
console.log(`\n📝 WHAT THIS MEANS:`);
console.log(`- Merchant 856377 exists and password is correct`);
console.log(`- But your domain (awantikaseeds.com) is not registered`);
console.log(`- NTT Data requires domain whitelist for security`);
console.log(`\n🔧 SOLUTIONS:`);
console.log(`1. IMMEDIATE: Contact NTT Data support with:`);
console.log(`   - Merchant ID: 856377`);
console.log(`   - Domain to register: awantikaseeds.com`);
console.log(`   - Ask to add domain to merchant whitelist`);
console.log(`\n2. ALTERNATIVE: Check if different domain was registered:`);
console.log(`   - Maybe registered with www.awantikaseeds.com?`);
console.log(`   - Maybe registered with different domain entirely?`);
console.log(`   - Ask NTT Data what domains are currently registered`);
console.log(`\n3. TEMPORARY WORKAROUND: Ask for UAT testing while waiting`);
console.log(`   - Use UAT credentials temporarily if needed`);
console.log(`   - Test full flow in UAT environment`);

console.log(`\n📞 NTT DATA SUPPORT CONTACT:`);
console.log(`- Dashboard: https://titan.atomtech.in/titan_merchant_console`);
console.log(`- Email: Technical support team`);
console.log(`- Provide: Merchant 856377, Domain awantikaseeds.com`);

console.log('\n' + '='.repeat(70) + '\n');