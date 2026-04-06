import { registerTool, getToolDeclarations, executeTool } from './registry';

import { changeUIThemeTool } from './implementations/theme';
import { setVisualTimerTool } from './implementations/timer';
import { setNeuralModeTool } from './implementations/neuralMode';
import { controlMusicTool } from './implementations/music';
import { playYouTubeMusicTool } from './implementations/youtube';
import { displayContentTool } from './implementations/displayContent';
import { searchImageTool } from './implementations/imageSearch';
import { getWeatherTool } from './implementations/weather';
import { getCryptoPriceTool } from './implementations/crypto';
import { getLatestNewsTool } from './implementations/news';
import { generateImageTool } from './implementations/generateImage';
import { showCodeTool } from './implementations/showCode';
import { controlSmartHomeTool } from './implementations/smartHome';

// Register all tools
registerTool(changeUIThemeTool);
registerTool(setVisualTimerTool);
registerTool(setNeuralModeTool);
registerTool(controlMusicTool);
registerTool(playYouTubeMusicTool);
registerTool(displayContentTool);
registerTool(searchImageTool);
registerTool(getWeatherTool);
registerTool(getCryptoPriceTool);
registerTool(getLatestNewsTool);
registerTool(generateImageTool);
registerTool(showCodeTool);
registerTool(controlSmartHomeTool);

export { getToolDeclarations, executeTool };
