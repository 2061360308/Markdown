# Hugo editor / Hugo 在线编辑器

## 介绍
Vue开发的在线Markdown编辑器，无需后端服务器，可随Hugo博客项目一起部署到Github Pages使用

## 特性
- 纯前端静态页面，无需服务器
- 支持从Github仓库拉取文章分支
- 支持浏览器端保存更改历史
- 支持根据更改内容自动生成提交信息
- 支持在线提交Github

## 预计开发任务
- [x] 迁移整理图标相关代码
- [ ] GitHub拉取/提交文件策略更新
- [ ] 文件管理器优化，外观，功能
- [ ] 主题统一，支持切换
- [ ] 允许加载/保存全局配置
- [ ] 编辑器添加处理格式字符串的功能
- [ ] 事件总线完善
- [ ] 更加完整的底部状态条功能
- [ ] 提供更多登录方式,注册成为GitHub App

## 使用
1. clone
2. pnpm install
3. pnpm build
4. 更改`dist/config.json`中配置信息为个人信息
5. 将打包生成的文件放到Hugo博客项目下的/static/editor目录下
6. 重新使用Hugo生成博客内容，访问 `博客根域名/editor/` 输入之前设置的密码即可开始使用
7. 博客文件部署Github Pages
> 有关token，需要在Github生成一个token，然后运行项目（pnpm run dev），运行打开后登录页面最下方有一个“生成新的token”的按钮，点击填入Github Token与个人期望的密码，这会生成一个加密后的Github Token将这个字符串填入配置文件即可


## 截图
![登录页面](./docs/images/屏幕截图%202025-01-04%20224037.png)

![编辑页面](./docs/images/屏幕截图%202025-01-04%20223235.png)

![提交页面](./docs/images/屏幕截图%202025-01-04%20223746.png)