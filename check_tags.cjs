const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/orders.tsx', 'utf8');
const tags = [
  'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
  'Card', 'CardHeader', 'CardTitle', 'CardContent',
  'Button', 'Input', 'Textarea', 'div', 'span', 'p', 'label'
];

tags.forEach(tag => {
  const openRegex = new RegExp('<' + tag + '(\\s|>)', 'g');
  const closeRegex = new RegExp('</' + tag + '>', 'g');
  const selfRegex = new RegExp('<' + tag + '[^>]*/>', 'g');
  
  const open = (content.match(openRegex) || []).length;
  const close = (content.match(closeRegex) || []).length;
  const self = (content.match(selfRegex) || []).length;
  
  console.log(`${tag}: ${open} open, ${close} close, ${self} self-closing, balance: ${open - close - self}`);
});
