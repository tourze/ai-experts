'use strict';
/**
 * Pre-execute hook for java-expert
 * 在技能执行前做最小输入校验。
 */

function preExecute(context) {
  if (context !== undefined && context !== null && typeof context !== 'object') {
    return {
      allow: false,
      message: 'java-expert: context 必须为对象或为空',
    };
  }
  return { allow: true };
}

module.exports = { preExecute };
