// Calculate relative luminance using WCAG formula
function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Determine if we should use white text based on background color
function shouldUseWhiteText(hex) {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = getRelativeLuminance(r, g, b);

  // Use white text if background is dark (luminance < 0.5)
  return luminance < 0.5;
}

async function createColorPaletteDesign(palette, paletteName) {
  await figma.loadFontAsync({ family: "Fira Code", style: "Medium" });

  // Find the PFP frame
  const pfpFrame = figma.currentPage.findOne((node) => node.name === "PFP");

  if (!pfpFrame) {
    figma.notify("Could not find frame named 'PFP'");
    return;
  }

  const frames = figma.currentPage.findAll((node) => node.type === "FRAME");

  // Get the position of the last frame (furthest right)
  let maxX = 0;
  let maxY = 0;
  let lastFrameHeight = 0;

  frames.forEach((frame) => {
    if (frame.x + frame.width > maxX) {
      maxX = frame.x + frame.width;
      lastFrameHeight = frame.height; // Capture the height of the last frame
    }
    if (frame.y + frame.height > maxY) {
      maxY = frame.y + frame.height;
    }
  });

  const newFrameX = maxX + 40; // Adding a little gap between frames
  const newFrameY = 0;

  // Create main frame and set its name based on the input palette name
  const frame = figma.createFrame();
  frame.name = paletteName || "Color Palette"; // Set the frame name
  frame.resize(1080, 1080);
  frame.x = newFrameX;
  frame.y = newFrameY; // Align to the top
  figma.currentPage.appendChild(frame);

  // Duplicate PFP frame and position it in top right
  const pfpClone = pfpFrame.clone();
  pfpClone.x = frame.width - pfpClone.width;
  pfpClone.y = 0;

  // Define column widths and heights
  const columnWidth = 360;

  // Create layout based on position
  palette.forEach((color, index) => {
    const { hex, name } = color;
    let x = 0;
    let y = 0;
    let height = 0;

    // Calculate position based on index
    if (index < 2) {
      // First column
      x = 0;
      y = index * 540;
      height = 540;
    } else if (index >= 2 && index < 5) {
      // Middle column
      x = 360;
      y = (index - 2) * 360;
      height = 360;
    } else {
      // Last column
      x = 720;
      y = (index - 5) * 540;
      height = 540;
    }

    // Create color box
    const colorBox = figma.createRectangle();
    colorBox.x = x;
    colorBox.y = y;
    colorBox.resize(columnWidth, height);
    colorBox.fills = [
      {
        type: "SOLID",
        color: {
          r: parseInt(hex.slice(1, 3), 16) / 255,
          g: parseInt(hex.slice(3, 5), 16) / 255,
          b: parseInt(hex.slice(5, 7), 16) / 255,
        },
      },
    ];

    // Create text labels (separate for name and hex)
    const nameLabel = figma.createText();
    nameLabel.fontName = { family: "Fira Code", style: "Medium" };
    nameLabel.characters = name;
    nameLabel.fontSize = 16;

    const hexLabel = figma.createText();
    hexLabel.fontName = { family: "Fira Code", style: "Medium" };
    hexLabel.characters = hex;
    hexLabel.fontSize = 16;

    // Set text color based on background
    const useWhiteText = shouldUseWhiteText(hex);
    const textColor = {
      type: "SOLID",
      color: useWhiteText
        ? { r: 1, g: 1, b: 1 } // White
        : { r: 0.2, g: 0.2, b: 0.2 }, // #333333
    };

    nameLabel.fills = [textColor];
    hexLabel.fills = [textColor];

    // Position text in bottom left corner with padding
    const textPadding = 20;
    nameLabel.x = x + textPadding;
    nameLabel.y =
      y + height - nameLabel.height - hexLabel.height - textPadding - 4; // Add 4px spacing

    hexLabel.x = x + textPadding;
    hexLabel.y = y + height - hexLabel.height - textPadding;

    // Add to frame
    frame.appendChild(colorBox);
    frame.appendChild(nameLabel);
    frame.appendChild(hexLabel);
    frame.appendChild(pfpClone);
  });

  figma.viewport.scrollAndZoomIntoView([frame]);
}

// Message handler
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-palette") {
    try {
      await createColorPaletteDesign(msg.palette, msg.paletteName);
      figma.closePlugin();
    } catch (error) {
      console.error("Failed to generate palette:", error);
    }
  }
};

// Show the UI
figma.showUI(__html__, { width: 400, height: 300 });
