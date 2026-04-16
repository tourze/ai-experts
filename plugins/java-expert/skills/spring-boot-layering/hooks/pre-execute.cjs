'use strict';
/**
 * Pre-execute hook for spring-boot-layering
 * 在技能执行前做最小输入校验。
 */

function preExecute(context) {
  if (context !== undefined && context !== null && typeof context !== 'object') {
    return {
      allow: false,
      message: 'spring-boot-layering: context 必须为对象或为空',
    };
  }
  return { allow: true };
}

module.exports = { preExecute };
