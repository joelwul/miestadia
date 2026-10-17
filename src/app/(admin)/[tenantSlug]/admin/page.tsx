// ... imports igual

export default function DashboardPage({ params }: Props) {
  // ... estado y lógica igual

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de tu alojamiento</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadData(tenantSlug)} disabled={refreshing} variant="outline" className="flex items-center gap-2 text-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
          <Link href={`/${tenantSlug}/admin/reservations`}>
            <Button size="sm" lg:size="lg" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Reserva</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats - 2 cols móvil, 5 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {[
          { label: 'Llegadas hoy', value: stats.todayArrivals, icon: Calendar, color: 'blue' },
          { label: 'Salidas hoy', value: stats.todayDepartures, icon: Clock, color: 'orange' },
          { label: 'Alojados', value: stats.currentGuests, icon: Users, color: 'green' },
          { label: 'Próximas', value: stats.upcomingReservations, icon: TrendingUp, color: 'purple' },
          { label: 'Ocupación', value: `${stats.occupancyRate}%`, icon: BarChart3, color: 'indigo' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold mt-1 lg:mt-2">{stat.value}</p>
                  </div>
                  <div className={`bg-${stat.color}-100 p-2 lg:p-3 rounded-lg`}>
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-${stat.color}-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content - 1 col en móvil, 2 en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Próximas llegadas */}
        <Card>
          <CardHeader className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Próximas llegadas
                </CardTitle>
              </div>
              <Link href={`/${tenantSlug}/admin/reservations`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            {upcomingArrivals.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No hay próximas llegadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingArrivals.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Huéspedes alojados */}
        <Card>
          <CardHeader className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Alojados ahora
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            {currentGuests.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Sin huéspedes alojados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentGuests.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-medium text-gray-900">
                        Sale: {new Date(reservation.check_out).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas - 2 cols móvil, 4 desktop */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { href: `/${tenantSlug}/admin/reservations`, icon: Calendar, label: 'Reservas' },
              { href: `/${tenantSlug}/admin/units`, icon: Bed, label: 'Unidades' },
              { href: `/${tenantSlug}/admin/guests`, icon: Users, label: 'Huéspedes' },
              { href: `/${tenantSlug}/admin/settings`, icon: Settings, label: 'Config' },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <Link key={i} href={action.href}>
                  <Button variant="outline" className="w-full h-16 lg:h-20 flex flex-col items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span>{action.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}