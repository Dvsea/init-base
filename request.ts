import { extend } from 'umi-request';
import { message } from 'antd';
import { history } from 'umi';
import { getToken, removeToken } from './tools';

const request = extend({
  timeout: 10000000,
});

request.interceptors.request.use((url, options) => {
  const tid =  getToken('tenantId') ? {
    ['qiankunding-tenant-id']: getToken('tenantId')
  } : {}
  const headers: any = {
    Authorization: getToken(),
    ...tid,
    ...(options.headers || {}),
  };
  return {
    url,
    options: { ...options, headers, interceptors: true },
  };
});

request.interceptors.response.use(async (response: Response, options: any) => {
  const codeMaps: any = {
    200: '服务器成功返回请求的数据',
    201: '新建或修改数据成功',
    202: '一个请求已经进入后台排队(异步任务)',
    204: '删除数据成功',
    400: 'Bad Request.',
    401: '用户没有权限(令牌、用户名、密码错误)',
    403: '用户得到授权，但是访问是被禁止的',
    404: 'Not Found',
    405: '请求方法不被允许',
    406: '请求的格式不可得',
    410: '请求的资源被永久删除，且不会再得到的',
    422: '当创建一个对象时，发生一个验证错误',
    500: '服务器发生错误，请检查服务器',
    502: '请求超时！',
    503: '服务不可用，服务器暂时过载或维护！',
    504: '网关超时！',
  };
  switch (response.status) {
    case 401:
      localStorage.clear()
      history.push('/login');
      message.error('登录过期，请重新登录')
      return Promise.reject(response);
    // case 500:
    //   // const server_err1 = await response.clone().json();
    //   message.error(codeMaps[response.status]);
    //   // return Promise.reject({ msg: '' });
    case 502:
    case 503:
    case 504:
      const server_err = await response.clone().json();
      message.error(server_err.message || codeMaps[response.status]);
      return Promise.reject({ msg: '' });
    default:
      const result = await response.clone().json();
      if (result?.code === 200 || result.data) {
        return result;
      } else if (result?.code === 401) {
        console.log('meet 401 when in route ', location.pathname);
        return Promise.reject(result);
      } else {
        message.error(result.msg || result.message || codeMaps[response.status] || codeMaps[result.code]);
        return Promise.reject(result);
      }
  }
});

export default request;
