const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/ToolPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the handleShare function or modal toggle and replace it
if (!content.includes("const handleShare = async () => {")) {
  const replacement = `
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tool.name,
          text: tool.description,
          url: window.location.href,
        });
        toast.success("Thanks for sharing!");
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };
`;
  // Let's insert the handleShare function before the return statement.
  content = content.replace("return (", replacement + "\n  return (");
}

// Update the onClick for the share button
content = content.replace(/onClick=\{\(\) => setIsShareModalOpen\(true\)\}/g, "onClick={handleShare}");

// Remove the ShareModal if it exists
content = content.replace(/<Dialog open=\{isShareModalOpen\}(.|[\r\n])*?<\/Dialog>/g, "");

fs.writeFileSync(file, content, 'utf8');
console.log('ToolPage.tsx updated with navigator.share.');
