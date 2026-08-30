/**
 * Adaptive Teaching Service Module
 * Dynamically adjusts teaching pace, complexity, and strategies based on student performance
 */
class AdaptiveTeachingService {
  /**
   * Determine the best next pedagogical step based on student progress
   */
  async determineNextPedagogicalStep(studentProgress, recentAnswers = [], concept) {
    if (!studentProgress) {
      throw new Error('studentProgress is required');
    }

    // Calculate average performance from recent answers
    const avgScore = recentAnswers.length > 0
      ? recentAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / recentAnswers.length
      : studentProgress.understandingScore || 0;

    const confidenceScore = this._calculateConfidence(recentAnswers);
    const misconceptionCount = recentAnswers.filter(a => a.misconceptions?.length > 0).length;

    // Decision tree for adaptation
    let action = 'continue_with_same_approach';
    let difficulty = studentProgress.difficulty || 'Intermediate';
    let strategy = 'explain_differently';

    if (avgScore >= 85 && confidenceScore >= 0.8) {
      // Excellent performance - advance
      action = 'move_to_next_concept';
      difficulty = this._increaseDifficulty(difficulty);
      strategy = 'deepen_understanding';
    } else if (avgScore >= 70 && confidenceScore >= 0.7) {
      // Good performance - continue
      action = 'continue_with_practice';
      strategy = 'reinforce_with_practice';
    } else if (avgScore >= 50 && avgScore < 70) {
      // Moderate performance - provide more support
      action = 'provide_additional_explanation';
      difficulty = this._maintainDifficulty(difficulty);
      strategy = 'use_analogy_or_example';
    } else if (avgScore < 50 || misconceptionCount > 1) {
      // Struggling - simplify
      action = 'simplify_and_review';
      difficulty = this._decreaseDifficulty(difficulty);
      strategy = 'break_into_smaller_steps';
    }

    return {
      action,
      difficulty,
      strategy,
      reasoning: `Average score: ${avgScore.toFixed(0)}%, Confidence: ${confidenceScore.toFixed(2)}, Misconceptions: ${misconceptionCount}`,
      nextSteps: this._getNextSteps(action, concept),
      timeAdjustment: this._adjustTime(avgScore)
    };
  }

  /**
   * Recommend remediation based on weak concept
   */
  async recommendRemediation(studentProgress, weakConcepts = []) {
    if (!studentProgress) {
      throw new Error('studentProgress is required');
    }

    const remediation = {
      concepts: weakConcepts,
      strategy: 'targeted_intervention',
      interventions: [],
      timeline: this._estimateRemediationTime(weakConcepts.length)
    };

    // Determine intervention strategies for each weak concept
    for (const concept of weakConcepts) {
      remediation.interventions.push({
        concept: concept.title || concept,
        approach: this._selectRemediationApproach(concept),
        activities: this._recommendActivities(concept),
        checkpointAssessment: `Reassess ${concept.title || concept} after intervention`
      });
    }

    return remediation;
  }

  /**
   * Adjust the lesson based on student feedback
   */
  adjustLessonPacing(currentPacing, studentFeedback) {
    if (studentFeedback.tooFast) {
      return {
        pacing: 'slow',
        adjustments: ['More explanation time', 'Additional examples', 'Practice between concepts']
      };
    } else if (studentFeedback.tooBoring || studentFeedback.tooSlow) {
      return {
        pacing: 'fast',
        adjustments: ['Deeper content', 'Complex examples', 'Challenge problems']
      };
    }
    return { pacing: 'normal', adjustments: [] };
  }

  /**
   * Personalize examples based on student interests
   */
  personalizeExample(baseExample, studentProfile) {
    if (!studentProfile) return baseExample;

    // If we have student interests, adapt examples
    const interests = studentProfile.interests || [];
    if (interests.length === 0) return baseExample;

    return `${baseExample} (Like in ${interests[0]} which you're interested in)`;
  }

  /**
   * Calculate confidence score from recent answers
   */
  _calculateConfidence(recentAnswers) {
    if (!recentAnswers || recentAnswers.length === 0) return 0.5;

    const correctCount = recentAnswers.filter(a => a.is_correct).length;
    return correctCount / recentAnswers.length;
  }

  /**
   * Get next steps based on action
   */
  _getNextSteps(action, concept = {}) {
    const steps = {
      'move_to_next_concept': [
        'Excellent understanding!',
        'Ready for the next concept',
        'Challenge question provided'
      ],
      'continue_with_practice': [
        'Try another practice question',
        'Apply concept to new scenario',
        'Compare with similar problems'
      ],
      'provide_additional_explanation': [
        'Review key points with new analogy',
        'Step-by-step worked example',
        'Practice with guided hints'
      ],
      'simplify_and_review': [
        'Break concept into smaller parts',
        'Start with simpler examples',
        'Focus on one teaching point at a time',
        'Rebuild foundation'
      ]
    };

    return steps[action] || ['Continue with current approach'];
  }

  /**
   * Adjust estimated time based on performance
   */
  _adjustTime(avgScore) {
    if (avgScore >= 85) return { adjustment: -25, reason: 'Fast learner, can move quicker' };
    if (avgScore >= 70) return { adjustment: 0, reason: 'On track' };
    if (avgScore >= 50) return { adjustment: 30, reason: 'Need more time and practice' };
    return { adjustment: 60, reason: 'Significant time needed for remediation' };
  }

  /**
   * Select appropriate remediation approach
   */
  _selectRemediationApproach(concept) {
    const approaches = [
      'Use concrete examples and demonstrations',
      'Break into smaller, simpler steps',
      'Use different teaching modality (visual vs textual)',
      'Connect to prior knowledge and experiences',
      'Provide guided practice with feedback'
    ];
    return approaches[Math.floor(Math.random() * approaches.length)];
  }

  /**
   * Recommend specific remediation activities
   */
  _recommendActivities(concept) {
    return [
      `Review foundational concepts for ${concept.title || concept}`,
      `Simple practice problems with worked solutions`,
      `Interactive visualization or simulation`,
      `Peer explanation or discussion`,
      `Real-world application example`
    ];
  }

  /**
   * Estimate remediation time needed
   */
  _estimateRemediationTime(conceptCount) {
    return `${conceptCount * 15}-${conceptCount * 25} minutes`;
  }

  /**
   * Increase difficulty level
   */
  _increaseDifficulty(current) {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : levels[levels.length - 1];
  }

  /**
   * Decrease difficulty level
   */
  _decreaseDifficulty(current) {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const currentIndex = levels.indexOf(current);
    return currentIndex > 0 ? levels[currentIndex - 1] : levels[0];
  }

  /**
   * Maintain difficulty level
   */
  _maintainDifficulty(current) {
    return current;
  }
}

module.exports = new AdaptiveTeachingService();
