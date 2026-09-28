const fs = require('fs');

// 1. Update PaymentCart.jsx
let pcPath = 'C:\\Users\\xuan sinh\\OneDrive\\Desktop\\SWP391\\SWP391_Code\\Frontend\\src\\features\\member\\pages\\PaymentCart.jsx';
let pcContent = fs.readFileSync(pcPath, 'utf8');

// Change axios.post body
pcContent = pcContent.replace("const response = await axios.post('http://localhost:8080/api/v1/payment/checkout', {}, {", "const response = await axios.post('http://localhost:8080/api/v1/payment/checkout', { paymentMethod: selectedMethod }, {");
fs.writeFileSync(pcPath, pcContent, 'utf8');

// 2. Update PaymentResult.jsx
let prPath = 'C:\\Users\\xuan sinh\\OneDrive\\Desktop\\SWP391\\SWP391_Code\\Frontend\\src\\features\\member\\pages\\PaymentResult.jsx';
let prContent = fs.readFileSync(prPath, 'utf8');

const oldAxios = `const response = await axios.get(\`http://localhost:8080/api/v1/payment/vnpay-callback?\${queryString}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });`;
        
const newAxios = `let endpoint = 'vnpay-callback';
        if (searchParams.has('partnerCode')) {
            endpoint = 'momo-callback';
        }
        const response = await axios.get(\`http://localhost:8080/api/v1/payment/\${endpoint}?\${queryString}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });`;

prContent = prContent.replace(oldAxios, newAxios);
fs.writeFileSync(prPath, prContent, 'utf8');

console.log('Frontend MoMo logic successfully updated!');
