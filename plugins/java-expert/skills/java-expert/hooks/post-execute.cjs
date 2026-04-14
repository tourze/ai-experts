'use strict';
/**
 * Post-execute hook for java-expert
 * 在技能执行后返回最小状态摘要。
 */

function postExecute(context) {
  return {
    ok: true,
    skill: 'java-expert',
    hasContext: Boolean(context && typeof context === 'object'),
  };
}

module.exports = { postExecute };
