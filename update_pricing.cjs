const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/PricingView.tsx';
let content = fs.readFileSync(file, 'utf8');

// The original line is: <span className="text-5xl font-black tracking-tight">${pricePro}</span>
// We want to replace it with:
// <span className="text-5xl font-black tracking-tight flex">$<motion.span key={isYearly ? 'y' : 'm'} initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{type:"spring"}}>{isYearly ? '5.40' : '9.00'}</motion.span></span>
// And change {isYearly ? 'mo billed year' : 'mo'} to {isYearly ? 'mo billed yearly' : 'mo'}

content = content.replace(
  '<span className="text-5xl font-black tracking-tight">${pricePro}</span>',
  '<span className="text-5xl font-black tracking-tight flex items-baseline">$<motion.span key={isYearly ? "yearly" : "monthly"} initial={{ opacity: 0, y: 15, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>{isYearly ? "5.40" : "9.00"}</motion.span></span>'
);

content = content.replace(
  "/{isYearly ? 'mo billed year' : 'mo'}",
  "/{isYearly ? 'mo billed yearly' : 'mo'}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('PricingView.tsx updated.');
