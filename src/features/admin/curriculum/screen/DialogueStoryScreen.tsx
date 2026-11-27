import React from 'react';
import { Sparkles } from 'lucide-react';
import { ScreenFormStateAndHandlers } from '../types';
import { getComicValidation } from '../utils';

interface DialogueStoryScreenProps {
  screenForm: ScreenFormStateAndHandlers;
  handleGenerateLessonImage?: () => void;
  isGeneratingImage?: boolean;
  imageGenerationError?: string | null;
  imageGenerationSuccess?: boolean;
}

export const DialogueStoryScreen: React.FC<DialogueStoryScreenProps> = ({
  screenForm,
  handleGenerateLessonImage,
  isGeneratingImage = false,
  imageGenerationError = null,
  imageGenerationSuccess = false,
}) => {
  const {
    chalType,
    chalAiCardATitle,
    setChalAiCardATitle,
    chalAiCardAText,
    setChalAiCardAText,
    chalAiCardBTitle,
    setChalAiCardBTitle,
    chalAiCardBText,
    setChalAiCardBText,
    chalAiCorrectCard,
    setChalAiCorrectCard,
    chalSpotText1,
    setChalSpotText1,
    chalSpotIsReal1,
    setChalSpotIsReal1,
    chalSpotExpl1,
    setChalSpotExpl1,
    chalSpotText2,
    setChalSpotText2,
    chalSpotIsReal2,
    setChalSpotIsReal2,
    chalSpotExpl2,
    setChalSpotExpl2,
    contentSceneType,
    setContentSceneType,
    contentBadge,
    setContentBadge,
    contentMediaType,
    setContentMediaType,
    contentMediaUrl,
    setContentMediaUrl,
    generationAspectRatio,
    setGenerationAspectRatio,
    contentHeading,
    setContentHeading,
    contentSubheading,
    setContentSubheading,
    contentBody,
    setContentBody,
    contentHighlightBox,
    setContentHighlightBox,
    contentQuote,
    setContentQuote,
    contentQuoteAuthor,
    setContentQuoteAuthor,
    contentBottomMessage,
    setContentBottomMessage,
    handleGenerateChallengeImage,
    isGeneratingChallengeImage,
  } = screenForm;

  const onGenerate = handleGenerateLessonImage || handleGenerateChallengeImage;
  const isGenerating = isGeneratingImage || isGeneratingChallengeImage;

  return (
    <>
      {/* C: AI VERSUS HUMAN COMPACT WORKSPACE */}
      {chalType === 'ai_vs_human' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">AI vs Human Fact Dual-Card Config</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">CARD A: FICTION</span>
              <input 
                type="text" 
                value={chalAiCardATitle} 
                onChange={(e) => setChalAiCardATitle(e.target.value)}
                placeholder="Title Card A" 
                className="w-full bg-white p-2 border border-slate-250 text-xs rounded-lg"
              />
              <textarea 
                value={chalAiCardAText} 
                onChange={(e) => setChalAiCardAText(e.target.value)}
                placeholder="Unscientific simulated code or claim..." 
                className="w-full bg-white p-2 border border-slate-250 text-xs rounded-lg resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">CARD B: TRUTH</span>
              <input 
                type="text" 
                value={chalAiCardBTitle} 
                onChange={(e) => setChalAiCardBTitle(e.target.value)}
                placeholder="Title Card B" 
                className="w-full bg-white p-2 border border-slate-250 text-xs rounded-lg"
              />
              <textarea 
                value={chalAiCardBText} 
                onChange={(e) => setChalAiCardBText(e.target.value)}
                placeholder="Scientific verified physical fact..." 
                className="w-full bg-white p-2 border border-slate-250 text-xs rounded-lg resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Which Card is AI Generated?</label>
            <select
              value={chalAiCorrectCard}
              onChange={(e) => setChalAiCorrectCard(e.target.value)}
              className="p-1.5 text-xs bg-white border border-slate-250 rounded-md outline-none"
            >
              <option value="opt_ai">Card B (AI Generated Card)</option>
              <option value="opt_human">Card A (AI Generated Card)</option>
            </select>
          </div>
        </div>
      )}

      {/* D: SPOT THE AI GENERATIVE ERRORS */}
      {chalType === 'spot_the_ai' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Audit Statements Config</h4>
          
          <div className="space-y-2.5">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <label className="block text-[10px] font-extrabold text-indigo-500">Statement Option A</label>
              <input 
                type="text" 
                value={chalSpotText1} 
                onChange={(e) => setChalSpotText1(e.target.value)}
                className="w-full bg-white border p-1 rounded mt-1 text-xs"
                placeholder="e.g. Gravity bends space-time fabric."
              />
              <div className="flex items-center gap-4 mt-2">
                <label className="text-xs flex items-center gap-1">
                  <input 
                    type="checkbox" 
                    checked={chalSpotIsReal1} 
                    onChange={(e) => setChalSpotIsReal1(e.target.checked)}
                  />
                  Is Generative AI Output
                </label>
                <input 
                  type="text" 
                  value={chalSpotExpl1} 
                  onChange={(e) => setChalSpotExpl1(e.target.value)}
                  className="flex-1 bg-white border p-1 rounded text-xs"
                  placeholder="Explanation on select"
                />
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <label className="block text-[10px] font-extrabold text-indigo-500">Statement Option B</label>
              <input 
                type="text" 
                value={chalSpotText2} 
                onChange={(e) => setChalSpotText2(e.target.value)}
                className="w-full bg-white border p-1 rounded mt-1 text-xs"
                placeholder="e.g. Heavy items drop slower than feathers inside vacuums."
              />
              <div className="flex items-center gap-4 mt-2">
                <label className="text-xs flex items-center gap-1">
                  <input 
                    type="checkbox" 
                    checked={chalSpotIsReal2} 
                    onChange={(e) => setChalSpotIsReal2(e.target.checked)}
                  />
                  Is Generative AI Output
                </label>
                <input 
                  type="text" 
                  value={chalSpotExpl2} 
                  onChange={(e) => setChalSpotExpl2(e.target.value)}
                  className="flex-1 bg-white border p-1 rounded text-xs"
                  placeholder="Explanation on select"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I: CONTENT AND VISUAL LESSON SCREEN CONFIGURATOR */}
      {(chalType === 'content_screen' || chalType === 'visual_lesson_screen') && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-left">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black uppercase text-indigo-700">📚 Content Screen Layout Configurator</h4>
            <p className="text-[10px] text-slate-400 mt-1">Combine any of the optional blocks below to build your visual lesson layout.</p>
          </div>

          {/* Story Scene Template Selector */}
          <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-3xs">
            <div className="space-y-0.5">
              <label className="block text-[10px] font-black uppercase text-indigo-700 tracking-wider">🎭 Story Scene Layout Style</label>
              <p className="text-[10px] text-slate-400">Choose one of the 6 narrative templates to render your lesson screen.</p>
            </div>
            <select
              value={contentSceneType || 'hero'}
              onChange={(e) => setContentSceneType(e.target.value)}
              className="w-full md:w-64 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="hero">🌟 Hero Scene (Impact Intro)</option>
              <option value="dialogue">💬 Dialogue Scene (Mascot Talk)</option>
              <option value="comic">📚 Comic Strip Scene (Multi-panel Grid)</option>
              <option value="cinematic">🎬 Cinematic Scene (Immersive Subtitles)</option>
              <option value="surprise">🎁 Surprise Scene (Interactive Reveal)</option>
              <option value="textbook">📖 Textbook Page (Digital Book)</option>
            </select>
          </div>

          {/* Responsive Helper Guide for Creators */}
          <div className="bg-indigo-50/40 rounded-xl p-3 border border-indigo-100/60 text-[11px] text-slate-600 leading-relaxed font-semibold">
            {contentSceneType === 'hero' && (
              <span>💡 <strong>Hero Layout</strong> centers a spectacular visual. Uses: <strong>Badge</strong>, <strong>Heading</strong>, <strong>Subheading</strong>, <strong>Body</strong>, and <strong>Highlight Box</strong>.</span>
            )}
            {contentSceneType === 'dialogue' && (
              <span>💬 <strong>Dialogue Layout</strong> presents character-led conversations. Uses: <strong>Media URL</strong> (Speaker avatar), <strong>Quote Speaker</strong> (Speaker name), and <strong>Quote Bubble</strong> (Speech bubble text).</span>
            )}
            {contentSceneType === 'comic' && (
              <span>📚 <strong>Comic Strip Layout</strong> splits body text by double-newlines/delimiters into sequential storyboard panels. Supports comma-separated <strong>Media URLs</strong>!</span>
            )}
            {contentSceneType === 'cinematic' && (
              <span>🎬 <strong>Cinematic Layout</strong> displays a widescreen theater block with overlay captions. Uses: <strong>Media URL</strong>, <strong>Heading</strong>, and <strong>Quote Bubble</strong> (Subtitles).</span>
            )}
            {contentSceneType === 'surprise' && (
              <span>🎁 <strong>Surprise Layout</strong> displays a gift wrap card that students unwrap with sound effects. Uses: <strong>Heading</strong>, <strong>Media URL</strong>, and <strong>Highlight Box</strong>.</span>
            )}
            {contentSceneType === 'textbook' && (
              <span>📖 <strong>Textbook Page</strong> renders a premium digital book page. Uses: <strong>Badge</strong> (Chapter tag), <strong>Heading</strong>, <strong>Body</strong> (with **highlights**), <strong>Media URL</strong> (Illustration), and <strong>Highlight Box</strong> (Fun Fact card).</span>
            )}
          </div>

          {/* Badge & Media Option */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Badge Text (Optional)</label>
              <input
                type="text"
                value={contentBadge}
                onChange={(e) => setContentBadge(e.target.value)}
                placeholder="e.g. AI Tip, Fun Fact, Challenge"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Media Format Type</label>
              <select
                value={contentMediaType}
                onChange={(e: any) => setContentMediaType(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-semibold outline-none"
              >
                <option value="image">Still Image</option>
                <option value="gif">Animated GIF</option>
                <option value="video">HTML5 MP4 Video</option>
              </select>
            </div>
            <div className={contentSceneType === 'comic' ? 'md:col-span-3' : ''}>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Media asset URL (Optional)</label>
              <input
                type="text"
                value={contentMediaUrl}
                onChange={(e) => setContentMediaUrl(e.target.value)}
                placeholder="e.g. https://...image.png"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />

              {/* AI Image Generation Control Widget */}
              <div className="mt-2.5 p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 shadow-3xs space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-indigo-600" />
                    <span>AI Screen Illustrator</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Aspect:</span>
                    <select
                      value={generationAspectRatio}
                      onChange={(e) => setGenerationAspectRatio(e.target.value)}
                      className="bg-white border border-slate-200 text-[10px] font-semibold px-2 py-1 rounded-md outline-none"
                    >
                      <option value="4:3">4:3 (Card)</option>
                      <option value="16:9">16:9 (Cinematic)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="3:4">3:4 (Portrait)</option>
                      <option value="9:16">9:16 (Vertical)</option>
                    </select>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-snug">
                  Generates a professional child-friendly space adventure illustration using the <strong className="text-slate-700">Chikoo style bible</strong>, matching your current <strong className="text-slate-700">Content Body</strong> as the prompt.
                </p>

                {imageGenerationError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-lg text-[10px] font-semibold text-rose-600 select-all overflow-x-auto max-h-24 leading-snug">
                    ❌ Error: {imageGenerationError}
                  </div>
                )}

                {imageGenerationSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-[10px] font-bold text-emerald-700 flex items-center gap-1.5 leading-none">
                    <span>✅ Generated & Updated successfully!</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isGenerating || !contentBody}
                  onClick={onGenerate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer shadow-4xs"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating Visual... (~15s)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="animate-pulse" />
                      <span>✨ Generate Image</span>
                    </>
                  )}
                </button>
                {!contentBody && (
                  <p className="text-[9px] text-amber-600 font-semibold text-center mt-1 leading-none">
                    ⚠️ Please enter some "Content Body" text first to use as description.
                  </p>
                )}
              </div>
              {contentSceneType === 'comic' && (
                <div className="mt-1.5 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <p className="text-[10px] font-bold text-slate-600">
                    Separate each image URL using commas.
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">img1.png,img2.png,img3.png</code>
                  </p>
                  {(() => {
                    const { imageStatus } = getComicValidation(contentBody, contentMediaUrl);
                    if (imageStatus.type === 'error') {
                      return <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">❌ {imageStatus.message}</p>;
                    } else if (imageStatus.type === 'warning') {
                      return <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">⚠️ {imageStatus.message}</p>;
                    } else if (imageStatus.type === 'success') {
                      return <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">✅ {imageStatus.message}</p>;
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Heading & Subheading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Heading (Optional)</label>
              <input
                type="text"
                value={contentHeading}
                onChange={(e) => setContentHeading(e.target.value)}
                placeholder="e.g. Why Good Prompts Matter"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Subheading (Optional)</label>
              <input
                type="text"
                value={contentSubheading}
                onChange={(e) => setContentSubheading(e.target.value)}
                placeholder="e.g. Learn how recommendations work."
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Content Body paragraphs */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Content Body Rich Text (Optional, supports bullet prefix)</label>
            <textarea
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              placeholder="e.g. Write your teaching text here.\n• Use a bullet starting with a bullet marker. \n• Any number of blocks."
              rows={4}
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs resize-none"
            />
            {contentSceneType === 'comic' && (
              <div className="mt-1.5 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <p className="text-[10px] font-bold text-slate-600">
                  Separate each comic dialogue using commas.
                </p>
                <p className="text-[9px] text-slate-500">
                  Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">Hi!,I'm learning AI!,Let's do it together!</code>
                </p>
                {(() => {
                  const { dialogueStatus } = getComicValidation(contentBody, contentMediaUrl);
                  if (dialogueStatus.type === 'error') {
                    return <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">❌ {dialogueStatus.message}</p>;
                  } else if (dialogueStatus.type === 'warning') {
                    return <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">⚠️ {dialogueStatus.message}</p>;
                  } else if (dialogueStatus.type === 'success') {
                    return <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">✅ {dialogueStatus.message}</p>;
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Highlight Pro tip Callout */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Highlight Box/Pro Takeaway callout (Optional)</label>
            <input
              type="text"
              value={contentHighlightBox}
              onChange={(e) => setContentHighlightBox(e.target.value)}
              placeholder="e.g. Pro Tip: Always include concrete examples in your instructions!"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
            />
          </div>

          {/* Quote/Idea item */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quote Bubble string (Optional)</label>
              <input
                type="text"
                value={contentQuote}
                onChange={(e) => setContentQuote(e.target.value)}
                placeholder="e.g. What a smart model is actually doing behind the scenes."
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quote Speaker Speaker (Optional)</label>
              <input
                type="text"
                value={contentQuoteAuthor}
                onChange={(e) => setContentQuoteAuthor(e.target.value)}
                placeholder="e.g. Aibo Copilot"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bottom takeaway reminder (Optional)</label>
            <input
              type="text"
              value={contentBottomMessage}
              onChange={(e) => setContentBottomMessage(e.target.value)}
              placeholder="e.g. Now let's try an exercise check to test this logic!"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
            />
          </div>
        </div>
      )}
    </>
  );
};
