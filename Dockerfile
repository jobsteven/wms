FROM hub.c.163.com/danielwang/wms:1.0.9

WORKDIR /app/

COPY dist/* .
COPY package.json .
COPY kickoff.sh .

RUN npm install --registry http://192.168.99.1:9999

ENV NODE_ENV production

# 服务安全认证
ENV KEY ''

# 公网地址 (*必填项)
ENV HOST '114.114.114.114'

# 信令端口 (默认WMS:7070)
ENV PORT 7070

# 集群REGISTER
ENV REGISTER ''
ENV REGPORT ''

# 信令超时
ENV HEARTBEAT 3000

# TURN/STUN端口
ENV STUNPORT 3478

ENV REPO '/data'

VOLUME /data

EXPOSE 80

RUN chmod 777 './kickoff.sh'

CMD ["./kickoff.sh"]
