export type GuideSection = {
  title: string;
  summary: string;
  steps: string[];
  practicePrompt: string;
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: '2×2 Ortega-style path',
    summary: 'Use the pocket cube to learn corner orientation and permutation without edge pieces getting in the way.',
    steps: [
      'Solve one complete face and make sure the side colors form a matching band.',
      'Orient the opposite face so the top becomes one solid color.',
      'Permute the final corners by recognising adjacent-swap versus diagonal-swap cases.',
    ],
    practicePrompt: 'Start with short scrambles. Do not chase speed until you can describe which corners moved.',
  },
  {
    title: 'Beginner method, 3×3',
    summary: 'A structured layer-by-layer route for solving a normal cube reliably before learning speed methods.',
    steps: [
      'Solve the white cross and align every cross edge with its side center.',
      'Insert white corners to finish the first layer without breaking the cross.',
      'Place middle-layer edges using left and right insertion triggers.',
      'Build the yellow cross, orient the yellow face, then permute last-layer corners and edges.',
    ],
    practicePrompt: 'Work one stage at a time. The app should eventually detect the current stage and only coach that stage.',
  },
  {
    title: 'Recognition-first drills',
    summary: 'Separate “what case am I seeing?” from “which algorithm do I run?” so the learner builds pattern memory.',
    steps: [
      'Show a case card or cube state without the algorithm at first.',
      'Ask the learner to name the case or choose the next strategic goal.',
      'Reveal the algorithm only after recognition, then score accuracy and hint usage inside the game.',
    ],
    practicePrompt: 'Use this after basic notation and first-layer confidence are established.',
  },
  {
    title: 'Camera-assisted solving',
    summary: 'Three visible faces are useful for guidance, but exact arbitrary solving needs enough observations to identify hidden pieces.',
    steps: [
      'Capture visible U/F/R faces and validate impossible color counts.',
      'Ask the user to rotate the cube for additional observations instead of pretending hidden stickers are known.',
      'Once all six faces or enough tracked observations are available, reconstruct the state and choose a solve path.',
    ],
    practicePrompt: 'For now, scan mode should be a state-gathering assistant, not a fake one-shot solver.',
  },
];
