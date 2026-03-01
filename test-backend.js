#!/usr/bin/env node

/**
 * Backend Validation Script
 * Tests all backend files and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating FoodByMe Backend...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function pass(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function fail(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function warn(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

// Check 1: Required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'server.js',
  'package.json',
  '.env',
  '.gitignore',
  'routes/auth.js',
  'routes/orders.js',
  'routes/restaurants.js',
  'routes/health.js',
  'middleware/auth.js',
  'lib/supabase.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    pass(`Found: ${file}`);
  } else {
    fail(`Missing: ${file}`);
  }
});

// Check 2: package.json validation
console.log('\n📦 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredDeps = [
    'express',
    '@supabase/supabase-js',
    'bcryptjs',
    'jsonwebtoken',
    'cors',
    'dotenv',
    'body-parser'
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      pass(`Dependency: ${dep}`);
    } else {
      fail(`Missing dependency: ${dep}`);
    }
  });
  
  if (pkg.scripts && pkg.scripts.dev) {
    pass('Dev script configured');
  } else {
    fail('Missing dev script');
  }
} catch (error) {
  fail(`Invalid package.json: ${error.message}`);
}

// Check 3: .env file validation
console.log('\n🔐 Checking .env configuration...');
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && !key.startsWith('#')) {
      envVars[key.trim()] = value ? value.trim() : '';
    }
  });
  
  if (envVars.PORT) {
    pass(`PORT configured: ${envVars.PORT}`);
  } else {
    warn('PORT not set (will default to 5001)');
  }
  
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length > 10) {
    pass('JWT_SECRET configured');
  } else {
    fail('JWT_SECRET missing or too short');
  }
  
  if (envVars.SUPABASE_URL) {
    pass('SUPABASE_URL configured');
  } else {
    warn('SUPABASE_URL not set - backend will fail to start');
  }
  
  if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
    pass('SUPABASE_SERVICE_ROLE_KEY configured');
  } else {
    warn('SUPABASE_SERVICE_ROLE_KEY not set - backend will fail to start');
  }
} catch (error) {
  fail(`.env file error: ${error.message}`);
}

// Check 4: Server.js validation
console.log('\n🖥️  Checking server.js...');
try {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  if (serverContent.includes('require(\'dotenv\').config()')) {
    pass('dotenv configured');
  } else {
    fail('dotenv not configured');
  }
  
  if (serverContent.includes('app.use(cors')) {
    pass('CORS configured');
  } else {
    fail('CORS not configured');
  }
  
  if (serverContent.includes('/api/auth')) {
    pass('Auth routes configured');
  } else {
    fail('Auth routes missing');
  }
  
  if (serverContent.includes('/api/restaurants')) {
    pass('Restaurant routes configured');
  } else {
    fail('Restaurant routes missing');
  }
  
  if (serverContent.includes('/api/orders')) {
    pass('Order routes configured');
  } else {
    fail('Order routes missing');
  }
  
  if (serverContent.includes('/api/health')) {
    pass('Health check configured');
  } else {
    warn('Health check route missing');
  }
} catch (error) {
  fail(`server.js error: ${error.message}`);
}

// Check 5: Routes validation
console.log('\n🛣️  Checking route files...');
const routes = ['auth', 'orders', 'restaurants', 'health'];
routes.forEach(route => {
  try {
    const routeContent = fs.readFileSync(path.join(__dirname, 'routes', `${route}.js`), 'utf8');
    
    if (routeContent.includes('express.Router()')) {
      pass(`${route}.js: Router configured`);
    } else {
      fail(`${route}.js: Router not configured`);
    }
    
    if (routeContent.includes('module.exports')) {
      pass(`${route}.js: Exports configured`);
    } else {
      fail(`${route}.js: Missing exports`);
    }
  } catch (error) {
    fail(`${route}.js: ${error.message}`);
  }
});

// Check 6: Middleware validation
console.log('\n🔒 Checking middleware...');
try {
  const authMiddleware = fs.readFileSync(path.join(__dirname, 'middleware', 'auth.js'), 'utf8');
  
  if (authMiddleware.includes('jwt.verify')) {
    pass('JWT verification configured');
  } else {
    fail('JWT verification missing');
  }
  
  if (authMiddleware.includes('module.exports')) {
    pass('Middleware exports configured');
  } else {
    fail('Middleware exports missing');
  }
} catch (error) {
  fail(`Middleware error: ${error.message}`);
}

// Check 7: Supabase client validation
console.log('\n🗄️  Checking Supabase client...');
try {
  const supabaseClient = fs.readFileSync(path.join(__dirname, 'lib', 'supabase.js'), 'utf8');
  
  if (supabaseClient.includes('createClient')) {
    pass('Supabase client configured');
  } else {
    fail('Supabase client not configured');
  }
  
  if (supabaseClient.includes('SUPABASE_URL') && supabaseClient.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    pass('Supabase credentials check configured');
  } else {
    fail('Supabase credentials check missing');
  }
} catch (error) {
  fail(`Supabase client error: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary:');
console.log('='.repeat(50));
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('='.repeat(50));

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('\n🎉 All checks passed! Backend is ready to start.');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure Supabase credentials are in .env');
  console.log('   2. Run: npm run dev');
  console.log('   3. Visit: http://localhost:5001/api/health');
  process.exit(0);
} else if (checks.failed === 0) {
  console.log('\n⚠️  Backend has warnings but should work.');
  console.log('   Check warnings above and fix if needed.');
  process.exit(0);
} else {
  console.log('\n❌ Backend has critical issues. Fix errors above before starting.');
  process.exit(1);
}
