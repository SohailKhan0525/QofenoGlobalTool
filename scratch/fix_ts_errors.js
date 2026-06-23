const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, 'src', filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
}

// Payment.tsx
replaceInFile('components/Pages/Payment.tsx', [
    [`import React, { useState } from 'react';`, `import React, { useState } from 'react';\nimport { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { faShieldHalved, faCircleCheck } from '@fortawesome/free-solid-svg-icons';`]
]);

// ResetPassword.tsx
replaceInFile('components/Pages/ResetPassword.tsx', [
    [`await account.updateRecovery(userId, secret, password, password);`, `await account.updateRecovery(userId, secret, password);`]
]);

// ToolsCatalog.tsx
replaceInFile('components/Pages/ToolsCatalog.tsx', [
    [`import React, { useState, useMemo, useEffect } from 'react';`, `import React, { useState, useMemo, useEffect } from 'react';\nimport { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { faMagnifyingGlass, faFire, faWandMagicSparkles, faSliders, faChevronDown, faChevronRight, faCheck, faHeart, faGear } from '@fortawesome/free-solid-svg-icons';`]
]);

// ToolPage.tsx
replaceInFile('components/Pages/ToolPage.tsx', [
    [`import React, { useState, useEffect } from 'react';`, `import React, { useState, useEffect } from 'react';\nimport { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { faShareNodes, faShieldHalved, faCirclePlay, faEye, faHeart, faCircleQuestion, faMagnifyingGlass, faXmark, faChevronDown, faCopy } from '@fortawesome/free-solid-svg-icons';\nimport { faFacebook, faTwitter, faLinkedin } from '@fortawesome/free-brands-svg-icons';`],
    [`tool.description`, `tool.desc`], // Property 'description' does not exist on type 'ToolCard'
    [`<Share2 `, `<FontAwesomeIcon icon={faShareNodes} `],
    [`<ShieldCheck `, `<FontAwesomeIcon icon={faShieldHalved} `],
    [`<PlayCircle `, `<FontAwesomeIcon icon={faCirclePlay} `],
    [`<Eye `, `<FontAwesomeIcon icon={faEye} `],
    [`<Heart `, `<FontAwesomeIcon icon={faHeart} `],
    [`<HelpCircle `, `<FontAwesomeIcon icon={faCircleQuestion} `],
    [`<Search `, `<FontAwesomeIcon icon={faMagnifyingGlass} `],
    [`<X `, `<FontAwesomeIcon icon={faXmark} `],
    [`<ChevronDown `, `<FontAwesomeIcon icon={faChevronDown} `],
    [`<Facebook `, `<FontAwesomeIcon icon={faFacebook} `],
    [`<Twitter `, `<FontAwesomeIcon icon={faTwitter} `],
    [`<Linkedin `, `<FontAwesomeIcon icon={faLinkedin} `],
    [`<Copy `, `<FontAwesomeIcon icon={faCopy} `],
    [`</Share2>`, `</FontAwesomeIcon>`],
    [`</ShieldCheck>`, `</FontAwesomeIcon>`],
    [`</PlayCircle>`, `</FontAwesomeIcon>`],
    [`</Eye>`, `</FontAwesomeIcon>`],
    [`</Heart>`, `</FontAwesomeIcon>`],
    [`</HelpCircle>`, `</FontAwesomeIcon>`],
    [`</Search>`, `</FontAwesomeIcon>`],
    [`</X>`, `</FontAwesomeIcon>`],
    [`</ChevronDown>`, `</FontAwesomeIcon>`],
    [`</Facebook>`, `</FontAwesomeIcon>`],
    [`</Twitter>`, `</FontAwesomeIcon>`],
    [`</Linkedin>`, `</FontAwesomeIcon>`],
    [`</Copy>`, `</FontAwesomeIcon>`],
]);

console.log("Done");
