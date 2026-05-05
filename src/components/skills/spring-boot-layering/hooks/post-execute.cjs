'use strict';
/**
 * Post-execute hook for spring-boot-layering
 * 在技能执行后返回最小状态摘要。
 */

function postExecute(context) {
  return {
    ok: true,
    skill: 'spring-boot-layering',
    hasContext: Boolean(context && typeof context === 'object'),
  };
}

module.exports = { postExecute };
