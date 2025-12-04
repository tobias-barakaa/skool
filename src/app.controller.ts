import { Controller, Get } from '@nestjs/common';
import { Auth } from './admin/auth/decorator/auth.decorator';
import { AuthType } from './admin/auth/enums/auth-type.enum';
import { Public } from './admin/auth/decorator/public.decorator';

@Controller()
export class AppController {

  @Public() 
  @Auth(AuthType.None)
  @Get()
  getRoot() {
    return {
      message: 'API is running',
      graphql: '/graphql',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Auth(AuthType.None)
  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  chromeDevTools() {
    return {};
  }

  @Public()
  @Auth(AuthType.None)
  @Get('health')
  health() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    };
  }

  @Get()
root() {
  return { status: 'ok' };
}
}

// import { Controller, Get } from '@nestjs/common';
// import { Auth } from './admin/auth/decorator/auth.decorator';
// import { AuthType } from './admin/auth/enums/auth-type.enum';
// import { Public } from './admin/auth/decorator/public.decorator';

// @Controller()
// export class AppController {

//   @Public() 
//   @Get()
//   @Auth(AuthType.None)
//   getRoot() {
//     return {
//       message: 'API is running',
//       graphql: '/graphql',
//       timestamp: new Date().toISOString(),
//     };
//   }

//   @Get('/.well-known/appspecific/com.chrome.devtools.json')
//   chromeDevTools() {
//     return {};
//   }


//   @Get('health')
//   health() {
//     return { status: 'ok', timestamp: new Date().toISOString() };
//   }
// }
// // N1GYZjUwLRfyib4








// bH9r5E7blkuFApZDyF1ruW76rtKESmZi8zl-hHoK

// name: coolify-proxy
// networks:
//   coolify:
//     external: true
// services:
//   traefik:

// container_name: coolify-proxy
// image: 'traefik:v3.1'
// restart: unless-stopped
// extra_hosts:
//   - 'host.docker.internal:host-gateway'
// networks:
//   - coolify
// ports:
//   - '80:80'
//   - '443:443'
//   - '443:443/udp'
//   - '8080:8080'
// healthcheck:
//   test: 'wget -qO- http://localhost:80/ping || exit 1'
//   interval: 4s
//   timeout: 2s
//   retries: 5
// volumes:
//   - '/var/run/docker.sock:/var/run/docker.sock:ro'
//   - '/data/coolify/proxy/:/traefik'
// command:
//   - '--ping=true'
//   - '--ping.entrypoint=http'
//   - '--api.dashboard=true'
//   - '--entrypoints.http.address=:80'
//   - '--entrypoints.https.address=:443'
//   - '--entrypoints.http.http.encodequerysemicolons=true'
//   - '--entryPoints.http.http2.maxConcurrentStreams=250'
//   - '--entrypoints.https.http.encodequerysemicolons=true'
//   - '--entryPoints.https.http2.maxConcurrentStreams=250'
//   - '--entrypoints.https.http3'
//   - '--providers.file.directory=/traefik/dynamic/'
//   - '--providers.file.watch=true'
//   - '--certificatesresolvers.letsencrypt.acme.httpchallenge=true'
//   - '--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=http'
//   - '--certificatesresolvers.letsencrypt.acme.storage=/traefik/acme.json'
//   - '--api.insecure=false'
//   - '--providers.docker=true'
//   - '--providers.docker.exposedbydefault=false'
// labels:
//   - traefik.enable=true
//   - traefik.http.routers.traefik.entrypoints=http
//   - traefik.http.routers.traefik.service=api@internal
//   - traefik.http.services.traefik.loadbalancer.server.port=8080
//   - coolify.managed=true
//   - coolify.proxy=true


// http:
//   routers:
//     dashboard:
//       rule: 'Host(`traefik.shadow.com`) && (PathPrefix(`/`))'
//       service: api@internal
//       tls:
//         certResolver: letsencrypt
//       middlewares:
//         - auth
//   middlewares:
//     auth:
//       basicAuth:
//         users:
//           - apr1$lc7s2ybj$.jBAdfm7A.17wxu4r5H1R1



// tobias@tobias-HP-15-Notebook-PC:~/Documents/ne/skool$ ssh root@94.16.119.140
// root@94.16.119.140's password: 
// Linux v2202409234754286314 6.1.0-37-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.140-1 (2025-05-22) x86_64

// The programs included with the Debian GNU/Linux system are free software;
// the exact distribution terms for each program are described in the
// individual files in /usr/share/doc/*/copyright.

// Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
// permitted by applicable law.
// Last login: Thu Dec  4 07:37:18 2025 from 41.90.172.189
// root@v2202409234754286314:~# cat /etc/nginx/sites-available/default
// ##
// # You should look at the following URL's in order to grasp a solid understanding
// # of Nginx configuration files in order to fully unleash the power of Nginx.
// # https://www.nginx.com/resources/wiki/start/
// # https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/
// # https://wiki.debian.org/Nginx/DirectoryStructure
// #
// # In most cases, administrators will remove this file from sites-enabled/ and
// # leave it as reference inside of sites-available where it will continue to be
// # updated by the nginx packaging team.
// #
// # This file will automatically load configuration files provided by other
// # applications, such as Drupal or Wordpress. These applications will be made
// # available underneath a path with that package name, such as /drupal8.
// #
// # Please see /usr/share/doc/nginx-doc/examples/ for more detailed examples.
// ##

// # Default server configuration
// #
// server {
// 	listen 80 default_server;
// 	listen [::]:80 default_server;

// 	# SSL configuration
// 	#
// 	# listen 443 ssl default_server;
// 	# listen [::]:443 ssl default_server;
// 	#
// 	# Note: You should disable gzip for SSL traffic.
// 	# See: https://bugs.debian.org/773332
// 	#
// 	# Read up on ssl_ciphers to ensure a secure configuration.
// 	# See: https://bugs.debian.org/765782
// 	#
// 	# Self signed certs generated by the ssl-cert package
// 	# Don't use them in a production server!
// 	#
// 	# include snippets/snakeoil.conf;

// 	root /var/www/html;

// 	# Add index.php to the list if you are using PHP
// 	index index.html index.htm index.nginx-debian.html;

// 	server_name _;

// 	location / {
// 		# First attempt to serve request as file, then
// 		# as directory, then fall back to displaying a 404.
// 		try_files $uri $uri/ =404;
// 	}

// 	# pass PHP scripts to FastCGI server
// 	#
// 	#location ~ \.php$ {
// 	#	include snippets/fastcgi-php.conf;
// 	#
// 	#	# With php-fpm (or other unix sockets):
// 	#	fastcgi_pass unix:/run/php/php7.4-fpm.sock;
// 	#	# With php-cgi (or other tcp sockets):
// 	#	fastcgi_pass 127.0.0.1:9000;
// 	#}

// 	# deny access to .htaccess files, if Apache's document root
// 	# concurs with nginx's one
// 	#
// 	#location ~ /\.ht {
// 	#	deny all;
// 	#}
// }


// # Virtual Host configuration for example.com
// #
// # You can move that to a different file under sites-available/ and symlink that
// # to sites-enabled/ to enable it.
// #
// #server {
// #	listen 80;
// #	listen [::]:80;
// #
// #	server_name example.com;
// #
// #	root /var/www/example.com;
// #	index index.html;
// #
// #	location / {
// #		try_files $uri $uri/ =404;
// #	}
// #}
