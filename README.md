# 埋点工具类

## 特性
- 支持参数类型定义
  - 配置对象形式
    - 基本类型 string, number, boolean
    - 基于 readonly [] 的枚举类型

  - 类声明形式
    - 配置形式，函数定义参数检验
    - 装饰器形式，自动添加参数检验
    - 接口继承形式，显式进行检验逻辑实现

- 完善的 API 调用代码提示
  - 事件、参数类型提示

- 支持函数与埋点耦合
  - before、after 的上报顺序
  - always 的错误发生仍上报

- 支持自定义 sender、validator 等相关适配器 API

## 使用例子
### 1. 使用配置定义 reporter
```ts
const reporter = new BaseReporter({
    common: {
        from: 'mp'
    },
    rules: {
        modal_click: {
            btn: 'string',
            times: 'number',
            is_first: 'boolean?',
        },
        page_show: {
            channels: ['ch1', 'ch2'] as const
            is_login: 'number?'
        }
    },
    sender: (event, params) => {
        // 数据上报适配
    },
    validator: (event, params, rules) => {
        // 自定义上报参数检验
    }
})
```

### 2. 适用类型声明定义 reporter

```ts

const modal_click = class {
    btn: string
    times: number
    is_first?: boolean
}

const page_show = class {
    channels: 'ch1' | 'ch2'
    is_login?: number
}

const test_info = class implements IReportEvent {
    name: string
    ids?: 0 | 1

    validation() {
        // ...
        return {
            name: String,
            ids: [0, 1, undefined]
        }
    }
}

const reporter = new BaseReporter({
    common: {
        from: 'mp'
    },
    rules: {
        modal_click,
        page_show
    },
    sender: (event, params) => {
        // 数据上报适配
    },
    validator: (event, params, rules) => {
        // 自定义上报参数检验
    }
})

```
